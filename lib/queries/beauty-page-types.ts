import { createClient } from "@/lib/supabase/server";

export type BeautyPageType = {
 id: string;
 name: string;
 description?: string;
 created_at?: string;
};

export async function getBeautyPageTypes(): Promise<BeautyPageType[]> {
 const supabase = await createClient();

 const { data, error } = await supabase
 .from("beauty_page_types")
 .select("*")
 .order("name");

 if (error) {
 console.error("Error fetching beauty page types:", error);
 return [];
 }

 return data ?? [];
}
