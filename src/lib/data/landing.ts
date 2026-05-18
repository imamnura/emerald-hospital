export const LANDING_BRAND = {
	name: 'Purwakarta Health',
	locationLabel: 'Purwakarta, 41115',
	locationSub: 'Purwakarta, Jakarta'
} as const;

export const LANDING_HERO = {
	headline: 'Access the Best Specialist Doctors in Purwakarta,',
	headlineHighlight: 'Seamlessly.',
	subheadline:
		'The integrated health platform for easy specialist discovery, verified ratings, and guaranteed online reservations.',
	ctaLabel: 'Start Online Appointment',
	searchSpecialtyPlaceholder: 'Specialty (e.g. Cardiologist)',
	searchHospitalPlaceholder: 'All Hospitals',
	searchButtonLabel: 'Search Doctors'
} as const;

export const LANDING_TRUST_BADGES = [
	{ id: 'reservation', label: '100% Online Reservation Guaranteed' },
	{ id: 'verified', label: 'Verified and experienced doctors' }
] as const;

export const LANDING_HOSPITALS = [
	{ value: 'all', label: 'All Hospitals' },
	{ value: 'rsud-purwakarta', label: 'RSUD Purwakarta' },
	{ value: 'emerald-hospital', label: 'Emerald Hospital Purwakarta' },
	{ value: 'mitra-sehat', label: 'Mitra Sehat Clinic' }
] as const;

export const LANDING_FEATURES = {
	title: 'Redefining Your Clinic Experience',
	subtitle: 'Modern features designed to prioritize your time and well-being.',
	items: [
		{
			id: 'search',
			title: 'Instant & Accurate Search',
			description:
				'Find specialized medical experts based on your specific symptoms or hospital preferences in seconds.'
		},
		{
			id: 'ratings',
			title: 'Transparent Rating System',
			description:
				'Review honest feedback from verified patients to help you choose the right specialist with confidence.'
		},
		{
			id: 'appointment',
			title: 'Mandatory Online Appointment',
			description:
				'No more waiting lines. Our platform enforces digital scheduling to ensure your slot is reserved and ready.'
		}
	]
} as const;

export const LANDING_POPULAR_DOCTORS = {
	title: 'Popular Specialist Doctors',
	subtitle: 'Top-rated medical practitioners near you in Purwakarta',
	viewAllLabel: 'View All Doctors',
	doctors: [
		{
			id: 'dr-andi-putra',
			name: 'Dr. Andi Putra',
			specialtyBadge: 'Cardiologist',
			title: 'Cardiovascular Specialist',
			rating: 4.8,
			reviewCount: 87,
			imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=128&h=128&fit=crop'
		},
		{
			id: 'dr-siti-rahayu',
			name: 'Dr. Siti Rahayu',
			specialtyBadge: 'Pediatrician',
			title: 'Child Health Specialist',
			rating: 4.9,
			reviewCount: 112,
			imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=128&h=128&fit=crop'
		},
		{
			id: 'dr-budi-santoso',
			name: 'Dr. Budi Santoso',
			specialtyBadge: 'Orthopedic',
			title: 'Bone & Joint Specialist',
			rating: 4.7,
			reviewCount: 64,
			imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=128&h=128&fit=crop'
		},
		{
			id: 'dr-maya-kusuma',
			name: 'Dr. Maya Kusuma',
			specialtyBadge: 'Dermatologist',
			title: 'Skin & Aesthetic Specialist',
			rating: 4.8,
			reviewCount: 95,
			imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=128&h=128&fit=crop'
		}
	]
} as const;

export const LANDING_TESTIMONIALS = {
	title: 'Real Experiences from Purwakarta',
	tabs: [
		{ id: 'doctor', label: 'Doctor Reviews' },
		{ id: 'app', label: 'App Reviews' }
	] as const,
	doctorReviews: [
		{
			id: 'dr-review-1',
			rating: 5,
			text: 'Dokter sangat ramah dan menjelaskan kondisi saya dengan detail. Proses booking online juga mudah sekali.',
			author: 'Indra Pamungkas',
			location: 'Purwakarta'
		},
		{
			id: 'dr-review-2',
			rating: 5,
			text: 'Antrian tidak panjang karena sudah daftar online. Sangat membantu untuk orang yang sibuk bekerja.',
			author: 'Rina Wulandari',
			location: 'Purwakarta'
		}
	],
	appReviews: [
		{
			id: 'app-review-1',
			rating: 5,
			text: 'Aplikasinya ringan dan mudah dipakai. Saya bisa cari dokter spesialis dan booking dalam hitungan menit.',
			author: 'Ahmad Fauzi',
			location: 'Purwakarta'
		},
		{
			id: 'app-review-2',
			rating: 5,
			text: 'Fitur rating dokter sangat membantu memilih spesialis yang tepat. Recommended untuk warga Purwakarta!',
			author: 'Dewi Lestari',
			location: 'Purwakarta'
		},
		{
			id: 'app-review-3',
			rating: 4,
			text: 'Platform terintegrasi yang bagus. Semoga segera ada lebih banyak rumah sakit mitra di area sekitar.',
			author: 'Hendra Gunawan',
			location: 'Purwakarta'
		}
	]
} as const;

export const LANDING_FOOTER = {
	tagline:
		'Providing healthcare technology innovation for easier access to quality specialist care across Purwakarta.',
	developmentCenter: {
		title: 'App Development Center',
		address: 'Jl. Siliwangi No. 45, Purwakarta, Jawa Barat 41115'
	},
	support: {
		title: 'Client Support',
		phone: '+62 264 200 1234',
		email: 'support@purwakartahealth.id',
		chatLabel: 'Chat with us'
	},
	copyright: '© 2024 PurwakartaHealth. All Rights Reserved.',
	socialLinks: [
		{ id: 'instagram', label: 'Instagram', href: '#' },
		{ id: 'facebook', label: 'Facebook', href: '#' },
		{ id: 'twitter', label: 'Twitter', href: '#' }
	]
} as const;
