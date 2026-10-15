export interface Testimonial { image: string; name: string; role: string; quote: string; }

export const testimonials: Testimonial[] = [
  {
    "image": "/img/client-1.jpg",
    "name": "Emily Anderson",
    "role": "Marketing Manager",
    "quote": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a lectus fermentum, volutpat ex sed, fringilla turpis. Morbi posuere ac mauris sed euismod."
  },
  {
    "image": "/img/client-2.jpg",
    "name": "Daniel Wilson",
    "role": "Lead Developer",
    "quote": "Cras ac sem a felis cursus hendrerit at eget justo. Donec eu mattis nunc. Mauris dapibus nunc mi, ac semper ipsum imperdiet et. Suspendisse potenti."
  },
  {
    "image": "/img/client-3.jpg",
    "name": "Sophia Carter",
    "role": "Creative Director",
    "quote": "Donec congue convallis eros in euismod. Nunc ultrices sapien et nibh viverra rutrum. Mauris rutrum interdum ex, vel fringilla leo consectetur pulvinar."
  }
];
