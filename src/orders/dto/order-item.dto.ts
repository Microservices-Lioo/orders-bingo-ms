import { IsNumber, IsPositive } from "class-validator";

export class OrderItemDto {
    @IsNumber()
    @IsPositive()
    cardId?: number;

    @IsNumber()
    @IsPositive()
    priceUnit: number;

    @IsNumber()
    @IsPositive()
    quantity: number;
}