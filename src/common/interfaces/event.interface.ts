import { StatusEvent } from "../enums";

export interface EventInterface {
    id: number;
    name: string;
    description: string;
    userId: number;
    status: StatusEvent;
    start_time: string;
    price: number;
}