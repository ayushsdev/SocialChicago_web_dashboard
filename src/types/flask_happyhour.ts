// Add these type definitions
export interface Schedule {
    days: string[];
    start_time: string;
    end_time: string;
  }
  
export interface Deal {
    item: string;
    description: string;
    deal: string;
  }
  
export interface HappyHourSession {
    name: string;
    schedule: Schedule;
    deals: Deal[];
    deals_summary: string;
  }

export interface HappyHourResponse {
    happy_hours: HappyHourSession[];
}
  export interface APIResponse {
    message: string;
    filename: string;
    pages: string[];
    analysis: HappyHourResponse
  }