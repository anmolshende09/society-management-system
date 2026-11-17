export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  snippet?: string;
  url: string;
}

export const SEARCH_API_TOKEN = Symbol("SearchApi");

export interface SearchApi {
  search(
    query: string,
    options?: { types?: string[]; limit?: number },
  ): Promise<SearchResultItem[]>;
}
