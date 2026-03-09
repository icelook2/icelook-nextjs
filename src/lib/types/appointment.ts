export interface AppointmentListItem {
	id: number;
	status: string;
	cancelledBy: string | null;
	cancelReason: string | null;
	cancelDescription: string | null;
	date: string;
	startTime: number;
	endTime: number;
	timezone: string;
	totalPrice: number;
	currency: string;
	createdAt: string;
	specialist: { nickname: string; name: string; avatarUrl: string | null };
	services: Array<{ serviceName: string; priceAmount: number; duration: number }>;
}

export interface SpecialistAppointmentDetail {
	id: number;
	status: string;
	cancelledBy: 'user' | 'specialist' | null;
	cancelReason: string | null;
	cancelDescription: string | null;
	date: string;
	startTime: number;
	endTime: number;
	timezone: string;
	totalPrice: number;
	currency: string;
	createdAt: string;
	user: { name: string; imageUrl: string | null };
	services: Array<{ serviceName: string; priceAmount: number; duration: number }>;
	lastAppointment: {
		id: number;
		date: string;
		startTime: number;
		endTime: number;
		totalPrice: number;
		currency: string;
		status: string;
	} | null;
}

export interface AppointmentsResponse {
	appointments: AppointmentListItem[];
	pagination: { page: number; totalPages: number; totalCount: number };
}
