import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { OrderStatusList } from "../enums/order.enum";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsEnum(OrderStatusList, {
      message: `Valid status are ${OrderStatus}`
  })
  status: OrderStatus

  @IsOptional()
  @IsDate()
  paidAt: Date

  @IsOptional()
  @IsString()
  stripePaymentIntentId: string;

  @IsOptional()
  @IsString()
  sessionId: string;
}
