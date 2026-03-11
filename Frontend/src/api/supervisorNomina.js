import { http } from "./http";

export async function fetchMyNomina(){
  const { data } = await http.get("/supervisor/workers");
  return data.workers || [];
}