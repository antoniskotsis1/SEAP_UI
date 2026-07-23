/**
 * Boundary mappers: real SEAPP API DTOs (`src/types/api.ts`, camelCase) →
 * the app's internal domain models (`src/types/models.ts`, snake_case).
 *
 * Mapping at the fetch boundary lets the existing pages, tables and detail
 * modals keep consuming the internal models unchanged while the data actually
 * comes from the real backend.
 */
import { formatNumber } from "@/lib/utils";
import type {
  Field,
  Producer,
  ProducerListItem,
  ProductionRecord,
  VarietyCount,
} from "@/types";
import type { FieldDto, ProducerDto, ProductionDto } from "@/types/api";

export function toProducer(dto: ProducerDto): Producer {
  return {
    id: dto.id,
    display_name: `${dto.name} ${dto.surname}`.trim(),
    // Kept so the edit form can round-trip name/surname back to the API.
    name: dto.name,
    surname: dto.surname,
    status: dto.status,
    afm: dto.taxIdentificationNumber ?? undefined,
    phone: dto.phone ?? undefined,
    email: dto.email ?? undefined,
    representative_name: dto.representativeName ?? undefined,
    region: dto.region ?? undefined,
    notes: dto.notes ?? undefined,
  };
}

/** The list uses `ProducerListItem`; the API has no `total_stremmata` yet. */
export const toProducerListItem = (dto: ProducerDto): ProducerListItem =>
  toProducer(dto);

export function toField(dto: FieldDto): Field {
  const varieties: VarietyCount[] = (
    [
      { variety: "MALE", tree_count: dto.maleCount },
      { variety: "AC22", tree_count: dto.ac22Count },
      { variety: "AC76", tree_count: dto.ac76Count },
    ] satisfies VarietyCount[]
  ).filter((v) => v.tree_count > 0);

  return {
    id: dto.id,
    producer_id: dto.producerId,
    producer_name: dto.producerName ?? "",
    location_name: dto.locationName,
    region: dto.region ?? undefined,
    stremmata: dto.area ?? undefined,
    gps_coordinates: dto.gpsCoordinates ?? undefined,
    comments: dto.comments ?? undefined,
    planting_date: dto.plantingDate ?? undefined,
    planting_method: dto.plantingMethod ?? undefined,
    training_shape: dto.trainingShape ?? undefined,
    rootstock: dto.rootstock ?? undefined,
    spacing: dto.spacing ?? undefined,
    total_plants: dto.totalTrees,
    planting_varieties: varieties,
    planting_summary:
      dto.totalTrees > 0 ? `${formatNumber(dto.totalTrees)} δέντρα` : undefined,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function toProductionRecord(dto: ProductionDto): ProductionRecord {
  return {
    id: dto.id,
    field_id: dto.fieldId,
    harvest_year: dto.year,
    ac22_kg: dto.ac22Kg,
    ac76_kg: dto.ac76Kg,
    // The API has no kg total (its `totalTrees` is a tree count), so derive it.
    quantity_kg: dto.ac22Kg + dto.ac76Kg,
    is_estimate: dto.isEstimation,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}
