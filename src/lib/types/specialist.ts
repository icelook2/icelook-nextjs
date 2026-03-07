export interface Service {
	id: number;
	name: string;
	description: string | null;
	priceAmount: number;
	duration: number;
}

export interface ServiceGroup {
	id: number;
	name: string;
	services: Service[];
}

export interface SpecialistContacts {
	phoneNumber1: string | null;
	phoneNumber2: string | null;
	phoneNumber3: string | null;
	instagram: string | null;
	rawAddress: string | null;
}

export interface Specialist {
	id: string;
	userId: number;
	name: string;
	nickname: string;
	avatarUrl: string | null;
	bio: string | null;
	currency: string;
	contacts: SpecialistContacts;
	timezone: string;
	timeStep: number;
	averageRating: number | null;
	totalReviews: number;
	nicknameChangedAt: string | null;
	createdAt: string;
	updatedAt: string;
	serviceGroups: ServiceGroup[];
	ungroupedServices: Service[];
}

export interface SpecialistResponse {
	specialist: Specialist;
}

export interface SearchSpecialist {
	id: number;
	nickname: string;
	name: string;
	avatarUrl: string | null;
	averageRating: number | null;
}

export interface SearchResponse {
	specialists: SearchSpecialist[];
	pagination: { page: number; totalPages: number; totalCount: number };
}

export interface DefaultSpecialist {
	id: number;
	nickname: string;
	name: string;
	avatarUrl: string | null;
}
