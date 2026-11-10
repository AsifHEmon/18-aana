import React from 'react';
import { ResilientImage } from './ResilientImage.tsx';

interface DepartmentCardsProps {
  onSelectDepartment: (department: string, categorySlug?: string) => void;
}

const DEPARTMENTS = [
  {
    name: 'Men',
    imageKey: 'men_dept',
    items: [
      { label: 'Punjabi', slug: 'punjabi' },
      { label: 'Casual Shirt', slug: 'casual-shirt' },
      { label: 'Flannel', slug: 'flannel' },
    ],
  },
  {
    name: 'Women',
    imageKey: 'women_dept',
    items: [
      { label: 'Sharee', slug: 'sharee' },
      { label: 'Kurti', slug: 'kurti' },
      { label: 'Three-piece', slug: 'three-piece' },
      { label: 'Salwar', slug: 'salwar' },
    ],
  },
  {
    name: 'Kids',
    imageKey: 'kids_dept',
    items: [
      { label: 'Fatua', slug: 'fatua' },
      { label: 'Boys' },
      { label: 'Girls' },
    ],
  },
];

export const DepartmentCards: React.FC<DepartmentCardsProps> = ({
  onSelectDepartment,
}) => {
  const goToProducts = (dept: string, slug?: string) => {
    onSelectDepartment(dept, slug);
    document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="depts" className="pt-2 pb-14">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.name}
              className="relative min-h-[380px] md:min-h-[480px] rounded-sm overflow-hidden text-white flex flex-col justify-end p-7 bg-[#4a0012] group"
            >
              <ResilientImage
                src={dept.imageKey}
                alt={`${dept.name} collection`}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2b000a]/90 via-[#2b000a]/35 to-transparent" />

              <div className="relative z-10">
                <h3 className="font-display text-[42px] leading-none">
                  {dept.name}
                </h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 my-3 text-sm text-white/90">
                  {dept.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => goToProducts(dept.name, item.slug)}
                        className="hover:underline"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => goToProducts(dept.name)}
                  className="inline-block bg-white text-[#7a001e] px-5 py-2.5 text-sm font-semibold rounded-sm hover:bg-[#fcf5f6] transition-colors whitespace-nowrap"
                >
                  Shop {dept.name.toLowerCase()}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
