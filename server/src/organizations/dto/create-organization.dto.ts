import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated (e.g. "acme-labs")',
  })
  slug!: string
}
