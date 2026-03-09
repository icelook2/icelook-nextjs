export interface Break {
	id: number;
	startTime: number;
	endTime: number;
}

export interface AppointmentService {
	id: number;
	serviceId: number;
	serviceName: string;
	priceAmount: number;
	duration: number;
}

export interface Appointment {
	id: number;
	status: string;
	startTime: number;
	endTime: number;
	totalPrice: number;
	currency: string;
	user: { id: number; name: string; image: string | null };
	services: AppointmentService[];
}

export interface WorkingDay {
	id: number;
	date: string;
	startTime: number;
	endTime: number;
	timeStep: number;
	breaks: Break[];
	appointments: Appointment[];
}
