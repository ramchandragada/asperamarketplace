/**
 * GSTR-8 style export for Aspera ECO TCS GSTIN.
 * Accountant files on GSTN — this only produces CSV / JSON from platform books.
 */
import { prisma } from "@/platform/db/prisma";
import { asperaLegal } from "@/platform/config/aspera-legal";

export type Gstr8Export = {
  periodMonth: string;
  tcsGstin: string;
  ecoLegalName: string;
  rows: Array<{
    sellerGstin: string;
    sellerId: string;
    suppliesPaise: number;
    returnsPaise: number;
    netTaxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    tcsPaise: number;
  }>;
  totals: {
    suppliesPaise: number;
    returnsPaise: number;
    netTaxablePaise: number;
    tcsPaise: number;
  };
};

export async function buildGstr8Export(periodMonth: string): Promise<Gstr8Export> {
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
    throw new Error("periodMonth must be YYYY-MM");
  }

  const lines = await prisma.tcsCollectionLine.findMany({
    where: { periodMonth },
    orderBy: { sellerGstin: "asc" },
  });

  const bySeller = new Map<
    string,
    {
      sellerGstin: string;
      sellerId: string;
      suppliesPaise: number;
      returnsPaise: number;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      tcsPaise: number;
    }
  >();

  for (const line of lines) {
    const key = line.sellerGstin;
    const current = bySeller.get(key) ?? {
      sellerGstin: line.sellerGstin,
      sellerId: line.sellerId,
      suppliesPaise: 0,
      returnsPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      tcsPaise: 0,
    };
    current.suppliesPaise += line.taxablePaise;
    current.cgstPaise += line.cgstPaise;
    current.sgstPaise += line.sgstPaise;
    current.igstPaise += line.igstPaise;
    current.tcsPaise += line.tcsPaise;
    bySeller.set(key, current);
  }

  const rows = [...bySeller.values()].map((row) => ({
    ...row,
    netTaxablePaise: row.suppliesPaise - row.returnsPaise,
  }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.suppliesPaise += row.suppliesPaise;
      acc.returnsPaise += row.returnsPaise;
      acc.netTaxablePaise += row.netTaxablePaise;
      acc.tcsPaise += row.tcsPaise;
      return acc;
    },
    {
      suppliesPaise: 0,
      returnsPaise: 0,
      netTaxablePaise: 0,
      tcsPaise: 0,
    },
  );

  return {
    periodMonth,
    tcsGstin: asperaLegal.gstinTcs,
    ecoLegalName: asperaLegal.legalEntity,
    rows,
    totals,
  };
}

export function gstr8ToCsv(report: Gstr8Export): string {
  const header = [
    "period_month",
    "eco_gstin_tcs",
    "seller_gstin",
    "supplies_paise",
    "returns_paise",
    "net_taxable_paise",
    "tcs_cgst_paise",
    "tcs_sgst_paise",
    "tcs_igst_paise",
    "tcs_total_paise",
  ].join(",");
  const body = report.rows.map((row) =>
    [
      report.periodMonth,
      report.tcsGstin,
      row.sellerGstin,
      row.suppliesPaise,
      row.returnsPaise,
      row.netTaxablePaise,
      row.cgstPaise,
      row.sgstPaise,
      row.igstPaise,
      row.tcsPaise,
    ].join(","),
  );
  return [header, ...body].join("\n") + "\n";
}
