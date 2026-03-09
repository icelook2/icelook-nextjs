export interface ClientListItem {
	id: number;
	name: string;
	email: string | null;
	image: string | null;
	note: string | null;
	createdAt: string;
	lastAppointmentAt: string | null;
}

export interface BlockedClientListItem extends ClientListItem {
	blockedAt: string;
}

export interface ClientsResponse {
	clients: ClientListItem[];
	pagination: { page: number; totalPages: number; totalCount: number };
}

export interface BlockedClientsResponse {
	clients: BlockedClientListItem[];
	pagination: { page: number; totalPages: number; totalCount: number };
}

export interface ClientContacts {
	phone1: string | null;
	phone2: string | null;
	instagram: string | null;
	telegram: string | null;
	whatsapp: string | null;
	viber: string | null;
}

export interface ClientPreferences {
	prefersMinimalConversation: boolean;
}

export interface ClientDetails {
	id: number;
	name: string;
	email: string | null;
	image: string | null;
	note: string | null;
	createdAt: string;
	blockedAt: string | null;
	contacts: ClientContacts;
	preferences: ClientPreferences;
}

export interface ClientAppointmentItem {
	id: number;
	status: string;
	date: string;
	startTime: number;
	endTime: number;
	totalPrice: number;
	currency: string;
	services: Array<{ serviceName: string; priceAmount: number; duration: number }>;
}

export interface ClientDetailsResponse {
	client: ClientDetails;
	upcomingAppointments: ClientAppointmentItem[];
	pastAppointments: ClientAppointmentItem[];
}
