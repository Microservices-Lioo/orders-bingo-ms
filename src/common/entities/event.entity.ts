import { StatusEvent } from "../enums";

export class EventEntity {
    id: number;
    name: string;
    description: string;
    userId: number;
    status: StatusEvent;
    time: Date;
    start_time: Date;
    end_time: Date;
}
