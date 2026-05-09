import { ApiEnvelope, PublicProfileItem } from "../../types";
import { apiClient } from "./client";

export async function getPublicProfileApi(userId: number): Promise<PublicProfileItem> {
  const { data } = await apiClient.get<ApiEnvelope<PublicProfileItem>>(`/users/${userId}`);
  return data.data;
}