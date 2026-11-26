/** Rating shown when a doctor has none yet (also the DB column default). */
export const DEFAULT_RATING = '4.5';

/** A doctor row as listed in the catalog and search results. */
export type DoctorListItem = {
	id: string;
	name: string;
	imageUrl: string | null;
	rating: string;
	reviewCount: number;
	consultationFee: string;
	isOnline: boolean;
	specialty: string;
	specialistSlug: string;
	hospital: string;
};
