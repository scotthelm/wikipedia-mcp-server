declare module "wikipedia" {
  export interface WikiPage {
    pageid: number;
    title: string;
    fullurl: string;
    summary(): Promise<any>;
    content(): Promise<string>;
    images(listOptions?: listOptions): Promise<any[]>;
  }

  export interface WikiSearchResult {
    results: any[];
    suggestion?: string;
  }

  export interface OnThisDayOptions {
    month: string;
    day: string;
    type?: "all" | "events" | "births" | "deaths" | "holidays" | "selected";
  }

  export interface OnThisDayResult {
    selected: any[];
    events: any[];
    births: any[];
    deaths: any[];
    holidays: any[];
  }

  export interface listOptions {
    autoSuggest?: boolean;
    redirect?: boolean;
    limit?: number;
  }

  export function page(title: string): Promise<WikiPage>;
  export function summary(title: string): Promise<any>;
  export function search(query: string): Promise<WikiSearchResult>;
  export function onThisDay(
    options?: OnThisDayOptions
  ): Promise<OnThisDayResult>;
  export function setLang(lang: string): Promise<string>;
  export function setUserAgent(userAgent: string): void;

  export default {
    page,
    summary,
    search,
    onThisDay,
    setLang,
    setUserAgent,
  };
}
