import React from 'react';
import { BookOpen, Award, Calendar, TrendingUp } from 'lucide-react';
import { ChildUnitProgress } from '../../services/api';

interface UnitProgressDisplayProps {
  progress: ChildUnitProgress | null;
  loading: boolean;
  compact?: boolean; // For contracts list view
  showDetailedUnits?: boolean; // For contract detail view
}

const UnitProgressDisplay: React.FC<UnitProgressDisplayProps> = ({ 
  progress, 
  loading, 
  compact = false,
  showDetailedUnits = false 
}) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-6">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No progress data available yet</p>
        <p className="text-xs text-gray-400 mt-1">Progress will appear after the first lesson</p>
      </div>
    );
  }

  const percentage = progress.percentageOfCurriculumCompleted || 0;

  // Compact view for contracts list
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Learning Progress</span>
            <span className="text-lg font-bold text-emerald-600">{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-inner"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 font-semibold">Units</p>
                <p className="text-lg font-bold text-gray-900">{progress.totalUnitsLearned}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-purple-700 font-semibold">Lessons</p>
                <p className="text-lg font-bold text-gray-900">{progress.uniqueLessonsCompleted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full view for contract detail page
  return (
    <div className="space-y-6">
      {/* Main Progress Indicator */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Curriculum Progress</h4>
              <p className="text-sm text-gray-600">Overall learning completion</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              {Math.round(percentage)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Complete</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Units Learned</p>
              <p className="text-2xl font-bold text-gray-900">{progress.totalUnitsLearned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{progress.uniqueLessonsCompleted}</p>
            </div>
          </div>
        </div>

        {progress.firstLessonDate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Started</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(progress.firstLessonDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {progress.lastLessonDate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Last Lesson</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(progress.lastLessonDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Unit Progress List */}
      {showDetailedUnits && progress.unitsProgress && progress.unitsProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Unit-by-Unit Breakdown
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {progress.unitsProgress
              .sort((a, b) => a.unitOrder - b.unitOrder)
              .map((unit, index) => (
                <div
                  key={unit.unitId}
                  className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                    unit.isCompleted
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          unit.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {unit.unitOrder || index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-gray-900">{unit.unitName}</h5>
                          {unit.isCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Practiced {unit.timesLearned} {unit.timesLearned === 1 ? 'time' : 'times'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {unit.lastLearnedDate && (
                        <p>
                          Last: {new Date(unit.lastLearnedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitProgressDisplay;
