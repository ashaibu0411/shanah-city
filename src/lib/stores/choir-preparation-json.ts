import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "choir-preparation.json");

type ChoirPreparationRecord = {
  userId: string;
  planKey: string;
  checked: string[];
  updatedAt: string;
};

async function readRecords(): Promise<ChoirPreparationRecord[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as ChoirPreparationRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: ChoirPreparationRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getChoirPreparation(userId: string, planKey: string) {
  const records = await readRecords();
  const match = records.find((row) => row.userId === userId && row.planKey === planKey);
  return match?.checked ?? [];
}

export async function setChoirPreparationChecked(
  userId: string,
  planKey: string,
  itemId: string,
  checked: boolean,
) {
  const records = await readRecords();
  const index = records.findIndex((row) => row.userId === userId && row.planKey === planKey);
  const current = index >= 0 ? [...records[index].checked] : [];
  const next = checked
    ? current.includes(itemId)
      ? current
      : [...current, itemId]
    : current.filter((id) => id !== itemId);

  const record: ChoirPreparationRecord = {
    userId,
    planKey,
    checked: next,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  await writeRecords(records.slice(-5000));
  return next;
}
