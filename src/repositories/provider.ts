import { mockRepositories } from "./mock/repositories";
import { googleSheetsRepositories } from "./sheets/repositories";

export function getRepositories() {
  return process.env.DATA_SOURCE === "google_sheets" ? googleSheetsRepositories : mockRepositories;
}
