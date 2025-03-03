import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator"

export class EventDto {
    @IsNumber()
    @IsPositive()
    id: number;

    @IsString()
    @IsNotEmpty()    
    name: string;
    
    @IsString()
    @IsNotEmpty()
    description: string;   

    @IsNumber()
    @IsPositive()
    userId: number;

    @IsNotEmpty()
    @IsNumber({
        maxDecimalPlaces: 4
    })
    @IsPositive()
    @Type( () => Number)
    price: number;
}
