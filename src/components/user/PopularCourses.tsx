import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Course {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  price: number;
  image_url: string | null;
  total_purchases: number;
  rating: number;
  category: string | null;
}

const PopularCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 700));

        const mockCoursesData: Course[] = [
          {
            id: '1',
            title: 'Calculus I - Fundamentals to Advanced',
            description: 'Comprehensive course on Calculus I, from limits and continuity to derivatives and integrals',
            tutor_id: '3',
            price: 299,
            image_url: 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=400',
            total_purchases: 156,
            rating: 4.9,
            category: 'Calculus'
          },
          {
            id: '2',
            title: 'Applied Linear Algebra',
            description: 'Learn matrices, vectors, linear transformations with real-world applications',
            tutor_id: '2',
            price: 349,
            image_url: 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=400',
            total_purchases: 124,
            rating: 4.9,
            category: 'Algebra'
          },
          {
            id: '3',
            title: 'Discrete Math for Programmers',
            description: 'Learn logic, combinatorics, graph theory and algorithms for computer science',
            tutor_id: '1',
            price: 399,
            image_url: 'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=400',
            total_purchases: 98,
            rating: 4.8,
            category: 'Discrete Math'
          }
        ];

        setCourses(mockCoursesData.sort((a, b) => b.total_purchases - a.total_purchases));
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading popular courses..." />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
          Popular Courses
        </h2>
        <span className="text-sm text-gray-500">Most Purchased</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.image_url || 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-lg">
                <span className="text-sm font-bold text-gray-900 flex items-center">
                  <span className="text-amber-400 mr-1">★</span>
                  {course.rating.toFixed(1)}
                </span>
              </div>
              <div className="absolute top-3 left-3 bg-green-500 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-lg">
                #{index + 1}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded">
                  {course.category}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                {course.title}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                {course.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {course.total_purchases} enrolled
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">
                    ${course.price}
                  </span>
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No courses available yet</p>
        </div>
      )}
    </div>
  );
};

export default PopularCourses;
