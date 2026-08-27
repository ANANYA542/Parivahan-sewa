import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  registrationNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  vehicleType!: string;
}
