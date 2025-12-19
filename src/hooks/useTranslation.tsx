import { useSettings, Language } from '../contexts/SettingsContext';

type TranslationKey = 
  | 'myChildren'
  | 'manageProfiles'
  | 'quickActions'
  | 'viewCourses'
  | 'browseCourses'
  | 'viewPackages'
  | 'browsePackages'
  | 'addChild'
  | 'children'
  | 'registered'
  | 'noChildren'
  | 'getStarted'
  | 'addFirstChild'
  | 'editChild'
  | 'addNewChild'
  | 'fullName'
  | 'school'
  | 'grade'
  | 'learningCenter'
  | 'optional'
  | 'dateOfBirth'
  | 'selectSchool'
  | 'selectCenter'
  | 'grade9'
  | 'grade10'
  | 'grade11'
  | 'grade12'
  | 'cancel'
  | 'saving'
  | 'update'
  | 'edit'
  | 'link'
  | 'delete'
  | 'confirmDelete'
  | 'cannotUndo'
  | 'settings'
  | 'theme'
  | 'language'
  | 'light'
  | 'dark'
  | 'english'
  | 'vietnamese'
  | 'save'
  | 'close'
  | 'goodMorning'
  | 'goodAfternoon'
  | 'goodEvening'
  | 'createContract'
  | 'bookSessions'
  | 'viewProgress'
  | 'trackProgress'
  | 'profile'
  | 'myContracts'
  | 'wallet'
  | 'signOut'
  | 'features'
  | 'pricing'
  | 'api'
  | 'documentation'
  | 'aboutUs'
  | 'careers'
  | 'blog'
  | 'press'
  | 'helpCenter'
  | 'contactUs'
  | 'status'
  | 'community'
  | 'privacyPolicy'
  | 'termsOfService'
  | 'cookiePolicy'
  | 'gdpr'
  | 'facebook'
  | 'madeWith'
  | 'allRightsReserved'
  | 'editProfile'
  | 'personalInformation'
  | 'changePassword'
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword'
  | 'updateProfile'
  | 'profileUpdated'
  | 'passwordChanged'
  | 'failedToLoad'
  | 'networkError'
  | 'phoneNumber'
  | 'location'
  | 'bio'
  | 'uploadPhoto'
  | 'removePhoto'
  | 'manageTutors'
  | 'manageTutorsDesc'
  | 'addStudent'
  | 'addStudentDesc'
  | 'scheduleSession'
  | 'scheduleSessionDesc'
  | 'manageCourses'
  | 'manageCoursesDesc'
  | 'viewCalendar'
  | 'viewCalendarDesc'
  | 'systemSettings'
  | 'systemSettingsDesc'
  | 'rescheduleRequest'
  | 'whyReschedule'
  | 'selectNewTime'
  | 'confirmRequest'
  | 'currentSession'
  | 'newSession'
  | 'alternativeTimes'
  | 'addNote'
  | 'submitRequest'
  | 'cancelRequest'
  | 'personalEmergency'
  | 'scheduleConflict'
  | 'illness'
  | 'other'
  | 'pleaseSpecify'
  | 'selectDate'
  | 'selectTime'
  | 'addAlternative'
  | 'removeAlternative'
  | 'requestSubmitted'
  | 'tutorNotified'
  | 'familyCommitment'
  | 'healthIssue'
  | 'workConflict'
  | 'transportationIssue'
  | 'back'
  | 'next'
  | 'mathDashDashboard'
  | 'dashboardDescription'
  | 'overviewAnalytics'
  | 'viewDetails'
  | 'analyticsChart'
  | 'chartIntegrationComingSoon'
  | 'packageSelection'
  | 'selectLearningPackage'
  | 'searchPackages'
  | 'filterBySubject'
  | 'filterByLevel'
  | 'sortBy'
  | 'allSubjects'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'allLevels'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'popular'
  | 'price'
  | 'rating'
  | 'duration'
  | 'sessions'
  | 'weeks'
  | 'reviews'
  | 'selectPackage'
  | 'enrollNow'
  | 'popularPackage'
  | 'recommendedPackage'
  | 'childManagement'
  | 'advancedChildManagement'
  | 'backToDashboard'
  | 'addNewChild'
  | 'editChild'
  | 'deleteChild'
  | 'uploadTestFiles'
  | 'testScores'
  | 'testFiles'
  | 'uploadDate'
  | 'downloadFile'
  | 'removeFile'
  | 'confirmDeleteChild'
  | 'childDeleted'
  | 'fileUploaded'
  | 'fileRemoved'
  | 'centerList'
  | 'learningCenters'
  | 'noCentersFound'
  | 'getStartedCenters'
  | 'tryAdjustingFilters'
  | 'addFirstCenter'
  | 'viewCenter'
  | 'editCenter'
  | 'createCenter'
  | 'centerDetails'
  | 'centerCapacity'
  | 'currentStudents'
  | 'availableSlots'
  | 'centerRating'
  | 'facilities'
  | 'contactCenter'
  | 'tutorRegister'
  | 'becomeTutor'
  | 'personalInformation'
  | 'professionalInformation'
  | 'documents'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'location'
  | 'bio'
  | 'subjects'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'hourlyRate'
  | 'availability'
  | 'resume'
  | 'certificates'
  | 'idDocument'
  | 'uploadFile'
  | 'removeFile'
  | 'addEducation'
  | 'addCertification'
  | 'addAvailability'
  | 'nextStep'
  | 'previousStep'
  | 'submitApplication'
  | 'applicationSubmitted'
  | 'centerForm'
  | 'createCenter'
  | 'editCenter'
  | 'centerName'
  | 'centerAddress'
  | 'centerCity'
  | 'centerDistrict'
  | 'centerPhone'
  | 'centerEmail'
  | 'centerDescription'
  | 'centerCapacity'
  | 'centerFacilities'
  | 'operatingHours'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
  | 'addFacility'
  | 'removeFacility'
  | 'saveCenter'
  | 'cancelCenter'
  | 'centerCreated'
  | 'centerUpdated'
  | 'learningProgress'
  | 'trackProgress'
  | 'viewDetailedReport'
  | 'downloadReport'
  | 'filterByChild'
  | 'filterBySubject'
  | 'filterByLevel'
  | 'allChildren'
  | 'allSubjects'
  | 'allLevels'
  | 'totalSessions'
  | 'completedSessions'
  | 'averageScore'
  | 'improvement'
  | 'lastTestScore'
  | 'lastTestDate'
  | 'tutorName'
  | 'centerName'
  | 'testResults'
  | 'tutorFeedback'
  | 'nextGoals'
  | 'performance'
  | 'attendance'
  | 'homework'
  | 'participation'
  | 'overallRating'
  | 'excellent'
  | 'good'
  | 'satisfactory'
  | 'needsImprovement'
  | 'courseList'
  | 'availableCourses'
  | 'noCoursesFound'
  | 'getStartedCourses'
  | 'tryAdjustingCourseFilters'
  | 'addFirstCourse'
  | 'viewCourse'
  | 'editCourse'
  | 'createCourse'
  | 'enrollCourse'
  | 'courseDetails'
  | 'courseCategory'
  | 'courseLevel'
  | 'courseStatus'
  | 'courseDuration'
  | 'coursePrice'
  | 'courseRating'
  | 'courseStudents'
  | 'courseDescription'
  | 'courseInstructor'
  | 'courseSchedule'
  | 'courseRequirements'
  | 'courseBenefits'
  | 'enrollNow'
  | 'viewDetails'
  | 'editCourse'
  | 'deleteCourse'
  | 'courseCreated'
  | 'courseUpdated'
  | 'courseDeleted'
  | 'tutorList'
  | 'findTutors'
  | 'searchTutors'
  | 'filterTutors'
  | 'sortBy'
  | 'allSubjects'
  | 'algebra'
  | 'geometry'
  | 'calculus'
  | 'statistics'
  | 'trigonometry'
  | 'preCalculus'
  | 'experience'
  | 'rating'
  | 'totalReviews'
  | 'location'
  | 'isVerified'
  | 'specialties'
  | 'languages'
  | 'viewProfile'
  | 'bookSession'
  | 'sendMessage'
  | 'yearsExperience'
  | 'verifiedTutor'
  | 'noTutorsFound'
  | 'tryAdjustingTutorFilters'
  | 'walletComponent'
  | 'myWallet'
  | 'walletBalance'
  | 'totalDeposits'
  | 'totalSpent'
  | 'recentTransactions'
  | 'deposit'
  | 'withdrawal'
  | 'payment'
  | 'refund'
  | 'completed'
  | 'pending'
  | 'failed'
  | 'addFunds'
  | 'withdrawFunds'
  | 'transactionHistory'
  | 'depositAmount'
  | 'depositMethod'
  | 'bankTransfer'
  | 'creditCard'
  | 'mobilePayment'
  | 'confirmDeposit'
  | 'depositSuccessful'
  | 'depositFailed'
  | 'insufficientFunds'
  | 'transactionId'
  | 'transactionDate'
  | 'transactionStatus'
  | 'transactionMethod'
  | 'noTransactions'
  | 'backToDashboard'
  | 'login'
  | 'signIn'
  | 'email'
  | 'password'
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'passwordMinLength'
  | 'loginFailed'
  | 'signInWithGoogle'
  | 'dontHaveAccount'
  | 'signUp'
  | 'forgotPassword'
  | 'rememberMe'
  | 'welcomeBack'
  | 'signInToAccount'
  | 'loginSuccess'
  | 'googleLoginSuccess'
  | 'googleLoginFailed'
  | 'invalidCredentials'
  | 'accountLocked'
  | 'tooManyAttempts'
  | 'emailNotVerified'
  | 'signup'
  | 'createAccount'
  | 'fullName'
  | 'phoneNumber'
  | 'gender'
  | 'confirmPassword'
  | 'male'
  | 'female'
  | 'other'
  | 'fullNameRequired'
  | 'phoneRequired'
  | 'genderRequired'
  | 'passwordMismatch'
  | 'signupSuccess'
  | 'signupFailed'
  | 'verificationEmailSent'
  | 'resendVerification'
  | 'verificationEmailSentAgain'
  | 'failedToResendVerification'
  | 'errorResendingEmail'
  | 'alreadyHaveAccount'
  | 'signInHere'
  | 'welcomeToMathBridge'
  | 'createYourAccount'
  | 'accountCreated'
  | 'pleaseVerifyEmail'
  | 'checkYourEmail'
  | 'clickVerificationLink'
  | 'courseCard'
  | 'enrollmentRate'
  | 'students'
  | 'maxStudents'
  | 'enrolled'
  | 'spotsLeft'
  | 'spotsAvailable'
  | 'enrollmentFull'
  | 'courseStatus'
  | 'courseLevel'
  | 'coursePrice'
  | 'courseDuration'
  | 'courseInstructor'
  | 'courseLocation'
  | 'courseSchedule'
  | 'courseDescription'
  | 'courseRequirements'
  | 'courseBenefits'
  | 'enrollNow'
  | 'viewDetails'
  | 'editCourse'
  | 'deleteCourse'
  | 'courseCreated'
  | 'courseUpdated'
  | 'courseDeleted'
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'free'
  | 'paid'
  | 'hours'
  | 'minutes'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'
  | 'online'
  | 'offline'
  | 'hybrid'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'weekend'
  | 'weekday';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    myChildren: 'My Children',
    manageProfiles: 'Manage your children\'s profiles and learning progress',
    quickActions: 'Quick Actions',
    viewCourses: 'View Courses',
    browseCourses: 'Browse available courses',
    viewPackages: 'View Packages',
    browsePackages: 'Browse available packages',
    addChild: 'Add Child',
    children: 'Children',
    registered: 'registered',
    noChildren: 'No children registered',
    getStarted: 'Get started by adding your first child to the system',
    addFirstChild: 'Add Your First Child',
    editChild: 'Edit Child',
    addNewChild: 'Add New Child',
    fullName: 'Full Name',
    school: 'School',
    grade: 'Grade',
    learningCenter: 'Learning Center',
    optional: 'Optional',
    dateOfBirth: 'Date of Birth',
    selectSchool: 'Select a school',
    selectCenter: 'Select a center (optional)',
    grade9: 'Grade 9',
    grade10: 'Grade 10',
    grade11: 'Grade 11',
    grade12: 'Grade 12',
    cancel: 'Cancel',
    saving: 'Saving...',
    update: 'Update',
    edit: 'Edit',
    link: 'Link',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this child? This action cannot be undone.',
    cannotUndo: 'This action cannot be undone.',
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    vietnamese: 'Vietnamese',
    save: 'Save',
    close: 'Close',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    createContract: 'Create Contract',
    bookSessions: 'Book new learning sessions',
    viewProgress: 'Daily Reports',
    trackProgress: 'View daily learning reports',
    profile: 'Profile',
    myContracts: 'My Contracts',
    wallet: 'Wallet',
    signOut: 'Sign Out',
    features: 'Features',
    pricing: 'Pricing',
    api: 'API',
    documentation: 'Documentation',
    aboutUs: 'About Us',
    careers: 'Careers',
    blog: 'Blog',
    press: 'Press',
    helpCenter: 'Help Center',
    contactUs: 'Contact Us',
    status: 'Status',
    community: 'Community',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    cookiePolicy: 'Cookie Policy',
    gdpr: 'GDPR',
    facebook: 'Facebook',
    madeWith: 'Made with',
    allRightsReserved: 'All rights reserved',
    editProfile: 'Edit Profile',
    personalInformation: 'Personal Information',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updateProfile: 'Update Profile',
    profileUpdated: 'Profile updated successfully!',
    passwordChanged: 'Password changed successfully!',
    failedToLoad: 'Failed to load user data',
    networkError: 'Network error occurred',
    phoneNumber: 'Phone Number',
    location: 'Location',
    bio: 'Bio',
    uploadPhoto: 'Upload Photo',
    removePhoto: 'Remove Photo',
    manageTutors: 'Manage Tutors',
    manageTutorsDesc: 'Manage all tutors in the system',
    addStudent: 'Add Student',
    addStudentDesc: 'Add new students to the platform',
    scheduleSession: 'Schedule Session',
    scheduleSessionDesc: 'Schedule new learning sessions',
    manageCourses: 'Manage Courses',
    manageCoursesDesc: 'Manage course content and curriculum',
    viewCalendar: 'View Calendar',
    viewCalendarDesc: 'View and manage calendar events',
    systemSettings: 'System Settings',
    systemSettingsDesc: 'Configure system preferences',
    rescheduleRequest: 'Reschedule Request',
    whyReschedule: 'Why do you need to reschedule?',
    selectNewTime: 'Select New Time',
    confirmRequest: 'Confirm Request',
    currentSession: 'Current Session',
    newSession: 'New Session',
    alternativeTimes: 'Alternative Times',
    addNote: 'Add Note',
    submitRequest: 'Submit Request',
    cancelRequest: 'Cancel Request',
    personalEmergency: 'Personal Emergency',
    scheduleConflict: 'Schedule Conflict',
    illness: 'Illness',
    other: 'Other',
    pleaseSpecify: 'Please specify your reason...',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    addAlternative: 'Add Alternative',
    removeAlternative: 'Remove Alternative',
    requestSubmitted: 'Request Submitted',
    tutorNotified: 'Tutor Notified',
    familyCommitment: 'Family Commitment',
    healthIssue: 'Health Issue',
    workConflict: 'Work Conflict',
    transportationIssue: 'Transportation Issue',
    back: 'Back',
    next: 'Next',
    mathDashDashboard: 'MathDash Dashboard',
    dashboardDescription: 'Mathematical tutoring management system • ∀ data ∈ Platform: analyze(data) = insights',
    overviewAnalytics: '∫ Overview Analytics',
    viewDetails: 'View Details',
    analyticsChart: 'Analytics chart y = mx + b',
    chartIntegrationComingSoon: '∫ Chart integration coming soon',
    packageSelection: 'Package Selection',
    selectLearningPackage: 'Select Learning Package',
    searchPackages: 'Search packages...',
    filterBySubject: 'Filter by Subject',
    filterByLevel: 'Filter by Level',
    sortBy: 'Sort by',
    allSubjects: 'All Subjects',
    mathematics: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    allLevels: 'All Levels',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    popular: 'Popular',
    price: 'Price',
    rating: 'Rating',
    duration: 'Duration',
    sessions: 'Sessions',
    weeks: 'weeks',
    reviews: 'reviews',
    selectPackage: 'Select Package',
    enrollNow: 'Enroll Now',
    popularPackage: 'Popular Package',
    recommendedPackage: 'Recommended Package',
    childManagement: 'Child Management',
    advancedChildManagement: 'Advanced Child Management',
    backToDashboard: 'Back to Dashboard',
    addNewChild: 'Add New Child',
    editChild: 'Edit Child',
    deleteChild: 'Delete Child',
    uploadTestFiles: 'Upload Test Files',
    testScores: 'Test Scores',
    testFiles: 'Test Files',
    uploadDate: 'Upload Date',
    downloadFile: 'Download File',
    removeFile: 'Remove File',
    confirmDeleteChild: 'Are you sure you want to delete this child?',
    childDeleted: 'Child deleted successfully',
    fileUploaded: 'File uploaded successfully',
    fileRemoved: 'File removed successfully',
    centerList: 'Center List',
    learningCenters: 'Learning Centers',
    noCentersFound: 'No centers found',
    getStartedCenters: 'Get started by adding your first learning center to begin managing your educational network',
    tryAdjustingFilters: 'Try adjusting your search filters or clearing them to see all centers',
    addFirstCenter: 'Add Your First Center',
    viewCenter: 'View Center',
    editCenter: 'Edit Center',
    createCenter: 'Create Center',
    centerDetails: 'Center Details',
    centerCapacity: 'Center Capacity',
    currentStudents: 'Current Students',
    availableSlots: 'Available Slots',
    centerRating: 'Center Rating',
    facilities: 'Facilities',
    contactCenter: 'Contact Center',
    tutorRegister: 'Tutor Registration',
    becomeTutor: 'Become a Tutor',
    personalInformation: 'Personal Information',
    professionalInformation: 'Professional Information',
    documents: 'Documents',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    bio: 'Bio',
    subjects: 'Subjects',
    experience: 'Experience',
    education: 'Education',
    certifications: 'Certifications',
    hourlyRate: 'Hourly Rate',
    availability: 'Availability',
    resume: 'Resume',
    certificates: 'Certificates',
    idDocument: 'ID Document',
    uploadFile: 'Upload File',
    removeFile: 'Remove File',
    addEducation: 'Add Education',
    addCertification: 'Add Certification',
    addAvailability: 'Add Availability',
    nextStep: 'Next Step',
    previousStep: 'Previous Step',
    submitApplication: 'Submit Application',
    applicationSubmitted: 'Application Submitted',
    centerForm: 'Center Form',
    createCenter: 'Create Center',
    editCenter: 'Edit Center',
    centerName: 'Center Name',
    centerAddress: 'Address',
    centerCity: 'City',
    centerDistrict: 'District',
    centerPhone: 'Phone',
    centerEmail: 'Email',
    centerDescription: 'Description',
    centerCapacity: 'Capacity',
    centerFacilities: 'Facilities',
    operatingHours: 'Operating Hours',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    addFacility: 'Add Facility',
    removeFacility: 'Remove Facility',
    saveCenter: 'Save Center',
    cancelCenter: 'Cancel',
    centerCreated: 'Center created successfully',
    centerUpdated: 'Center updated successfully',
    learningProgress: 'Learning Progress',
    trackProgress: 'Track Progress',
    viewDetailedReport: 'View Detailed Report',
    downloadReport: 'Download Report',
    filterByChild: 'Filter by Child',
    filterBySubject: 'Filter by Subject',
    filterByLevel: 'Filter by Level',
    allChildren: 'All Children',
    allSubjects: 'All Subjects',
    allLevels: 'All Levels',
    totalSessions: 'Total Sessions',
    completedSessions: 'Completed Sessions',
    averageScore: 'Average Score',
    improvement: 'Improvement',
    lastTestScore: 'Last Test Score',
    lastTestDate: 'Last Test Date',
    tutorName: 'Tutor Name',
    centerName: 'Center Name',
    testResults: 'Test Results',
    tutorFeedback: 'Tutor Feedback',
    nextGoals: 'Next Goals',
    performance: 'Performance',
    attendance: 'Attendance',
    homework: 'Homework',
    participation: 'Participation',
    overallRating: 'Overall Rating',
    excellent: 'Excellent',
    good: 'Good',
    satisfactory: 'Satisfactory',
    needsImprovement: 'Needs Improvement',
    courseList: 'Course List',
    availableCourses: 'Available Courses',
    noCoursesFound: 'No courses found',
    getStartedCourses: 'Get started by adding your first course to begin managing your educational content',
    tryAdjustingCourseFilters: 'Try adjusting your search filters or clearing them to see all courses',
    addFirstCourse: 'Add Your First Course',
    viewCourse: 'View Course',
    editCourse: 'Edit Course',
    createCourse: 'Create Course',
    enrollCourse: 'Enroll Course',
    courseDetails: 'Course Details',
    courseCategory: 'Category',
    courseLevel: 'Level',
    courseStatus: 'Status',
    courseDuration: 'Duration',
    coursePrice: 'Price',
    courseRating: 'Rating',
    courseStudents: 'Students',
    courseDescription: 'Description',
    courseInstructor: 'Instructor',
    courseSchedule: 'Schedule',
    courseRequirements: 'Requirements',
    courseBenefits: 'Benefits',
    enrollNow: 'Enroll Now',
    viewDetails: 'View Details',
    editCourse: 'Edit Course',
    deleteCourse: 'Delete Course',
    courseCreated: 'Course created successfully',
    courseUpdated: 'Course updated successfully',
    courseDeleted: 'Course deleted successfully',
    tutorList: 'Tutor List',
    findTutors: 'Find Tutors',
    searchTutors: 'Search tutors...',
    filterTutors: 'Filter Tutors',
    sortBy: 'Sort by',
    allSubjects: 'All Subjects',
    algebra: 'Algebra',
    geometry: 'Geometry',
    calculus: 'Calculus',
    statistics: 'Statistics',
    trigonometry: 'Trigonometry',
    preCalculus: 'Pre-Calculus',
    experience: 'Experience',
    rating: 'Rating',
    totalReviews: 'Total Reviews',
    location: 'Location',
    isVerified: 'Verified',
    specialties: 'Specialties',
    languages: 'Languages',
    viewProfile: 'View Profile',
    bookSession: 'Book Session',
    sendMessage: 'Send Message',
    yearsExperience: 'years experience',
    verifiedTutor: 'Verified Tutor',
    noTutorsFound: 'No tutors found',
    tryAdjustingTutorFilters: 'Try adjusting your search filters to see more tutors',
    walletComponent: 'Wallet Component',
    myWallet: 'My Wallet',
    walletBalance: 'Wallet Balance',
    totalDeposits: 'Total Deposits',
    totalSpent: 'Total Spent',
    recentTransactions: 'Recent Transactions',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    payment: 'Payment',
    refund: 'Refund',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    addFunds: 'Add Funds',
    withdrawFunds: 'Withdraw Funds',
    transactionHistory: 'Transaction History',
    depositAmount: 'Deposit Amount',
    depositMethod: 'Deposit Method',
    bankTransfer: 'Bank Transfer',
    creditCard: 'Credit Card',
    mobilePayment: 'Mobile Payment',
    confirmDeposit: 'Confirm Deposit',
    depositSuccessful: 'Deposit successful',
    depositFailed: 'Deposit failed',
    insufficientFunds: 'Insufficient funds',
    transactionId: 'Transaction ID',
    transactionDate: 'Transaction Date',
    transactionStatus: 'Status',
    transactionMethod: 'Method',
    noTransactions: 'No transactions found',
    backToDashboard: 'Back to Dashboard',
    login: 'Login',
    signIn: 'Sign In',
    email: 'Email',
    password: 'Password',
    emailRequired: 'Email is required',
    emailInvalid: 'Email is invalid',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 6 characters',
    loginFailed: 'Login failed',
    signInWithGoogle: 'Sign in with Google',
    dontHaveAccount: 'Don\'t have an account?',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    welcomeBack: 'Welcome Back',
    signInToAccount: 'Sign in to your account',
    loginSuccess: 'Login successful',
    googleLoginSuccess: 'Google login successful',
    googleLoginFailed: 'Google login failed',
    invalidCredentials: 'Email or password is invalid',
    accountLocked: 'Your account has been banned. Please contact Admin.',
    tooManyAttempts: 'Too many attempts',
    emailNotVerified: 'Email not verified. Please check your email and verify your account.',
    signup: 'Sign Up',
    createAccount: 'Create Account',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    gender: 'Gender',
    confirmPassword: 'Confirm Password',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    fullNameRequired: 'Full name is required',
    phoneRequired: 'Phone number is required',
    genderRequired: 'Gender is required',
    passwordMismatch: 'Passwords do not match',
    signupSuccess: 'Signup successful',
    signupFailed: 'Signup failed',
    verificationEmailSent: 'Verification email sent',
    resendVerification: 'Resend Verification',
    verificationEmailSentAgain: 'Verification email sent again!',
    failedToResendVerification: 'Failed to resend verification email.',
    errorResendingEmail: 'Error occurred while resending email.',
    alreadyHaveAccount: 'Already have an account?',
    signInHere: 'Sign in here',
    welcomeToMathBridge: 'Welcome to MathBridge',
    createYourAccount: 'Create your account',
    accountCreated: 'Account created',
    pleaseVerifyEmail: 'Please verify your email',
    checkYourEmail: 'Check your email',
    clickVerificationLink: 'Click the verification link',
    courseCard: 'Course Card',
    enrollmentRate: 'Enrollment Rate',
    students: 'Students',
    maxStudents: 'Max Students',
    enrolled: 'Enrolled',
    spotsLeft: 'Spots Left',
    spotsAvailable: 'Spots Available',
    enrollmentFull: 'Enrollment Full',
    courseStatus: 'Course Status',
    courseLevel: 'Course Level',
    coursePrice: 'Course Price',
    courseDuration: 'Course Duration',
    courseInstructor: 'Course Instructor',
    courseLocation: 'Course Location',
    courseSchedule: 'Course Schedule',
    courseDescription: 'Course Description',
    courseRequirements: 'Course Requirements',
    courseBenefits: 'Course Benefits',
    enrollNow: 'Enroll Now',
    viewDetails: 'View Details',
    editCourse: 'Edit Course',
    deleteCourse: 'Delete Course',
    courseCreated: 'Course Created',
    courseUpdated: 'Course Updated',
    courseDeleted: 'Course Deleted',
    active: 'Active',
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    free: 'Free',
    paid: 'Paid',
    hours: 'Hours',
    minutes: 'Minutes',
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
    years: 'Years',
    online: 'Online',
    offline: 'Offline',
    hybrid: 'Hybrid',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    weekend: 'Weekend',
    weekday: 'Weekday',
  },
  vi: {
    myChildren: 'Trẻ em của tôi',
    manageProfiles: 'Quản lý hồ sơ và tiến độ học tập của trẻ',
    quickActions: 'Hành động nhanh',
    viewCourses: 'Xem khóa học',
    browseCourses: 'Duyệt các khóa học có sẵn',
    viewPackages: 'Xem gói học',
    browsePackages: 'Duyệt các gói học có sẵn',
    addChild: 'Thêm trẻ',
    children: 'Trẻ em',
    registered: 'đã đăng ký',
    noChildren: 'Chưa có trẻ nào được đăng ký',
    getStarted: 'Bắt đầu bằng cách thêm trẻ đầu tiên vào hệ thống',
    addFirstChild: 'Thêm trẻ đầu tiên',
    editChild: 'Sửa thông tin trẻ',
    addNewChild: 'Thêm trẻ mới',
    fullName: 'Họ và tên',
    school: 'Trường học',
    grade: 'Lớp học',
    learningCenter: 'Trung tâm học tập',
    optional: 'Tùy chọn',
    dateOfBirth: 'Ngày sinh',
    selectSchool: 'Chọn trường học',
    selectCenter: 'Chọn trung tâm (tùy chọn)',
    grade9: 'Lớp 9',
    grade10: 'Lớp 10',
    grade11: 'Lớp 11',
    grade12: 'Lớp 12',
    cancel: 'Hủy',
    saving: 'Đang lưu...',
    update: 'Cập nhật',
    edit: 'Sửa',
    link: 'Liên kết',
    delete: 'Xóa',
    confirmDelete: 'Bạn có chắc chắn muốn xóa trẻ này? Hành động này không thể hoàn tác.',
    cannotUndo: 'Hành động này không thể hoàn tác.',
    settings: 'Cài đặt',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    light: 'Sáng',
    dark: 'Tối',
    english: 'Tiếng Anh',
    vietnamese: 'Tiếng Việt',
    save: 'Lưu',
    close: 'Đóng',
    goodMorning: 'Chào buổi sáng',
    goodAfternoon: 'Chào buổi chiều',
    goodEvening: 'Chào buổi tối',
    createContract: 'Tạo hợp đồng',
    bookSessions: 'Đặt lịch học mới',
    viewProgress: 'Báo cáo hàng ngày',
    trackProgress: 'Xem báo cáo học tập hàng ngày',
    profile: 'Hồ sơ',
    myContracts: 'Hợp đồng của tôi',
    wallet: 'Ví',
    signOut: 'Đăng xuất',
    features: 'Tính năng',
    pricing: 'Giá cả',
    api: 'API',
    documentation: 'Tài liệu',
    aboutUs: 'Về chúng tôi',
    careers: 'Tuyển dụng',
    blog: 'Blog',
    press: 'Báo chí',
    helpCenter: 'Trung tâm trợ giúp',
    contactUs: 'Liên hệ',
    status: 'Trạng thái',
    community: 'Cộng đồng',
    privacyPolicy: 'Chính sách bảo mật',
    termsOfService: 'Điều khoản dịch vụ',
    cookiePolicy: 'Chính sách cookie',
    gdpr: 'GDPR',
    facebook: 'Facebook',
    madeWith: 'Được tạo với',
    allRightsReserved: 'Tất cả quyền được bảo lưu',
    editProfile: 'Chỉnh sửa hồ sơ',
    personalInformation: 'Thông tin cá nhân',
    changePassword: 'Đổi mật khẩu',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
    updateProfile: 'Cập nhật hồ sơ',
    profileUpdated: 'Cập nhật hồ sơ thành công!',
    passwordChanged: 'Đổi mật khẩu thành công!',
    failedToLoad: 'Không thể tải dữ liệu người dùng',
    networkError: 'Lỗi mạng',
    phoneNumber: 'Số điện thoại',
    location: 'Địa chỉ',
    bio: 'Giới thiệu',
    uploadPhoto: 'Tải ảnh lên',
    removePhoto: 'Xóa ảnh',
    manageTutors: 'Quản lý gia sư',
    manageTutorsDesc: 'Quản lý tất cả gia sư trong hệ thống',
    addStudent: 'Thêm học sinh',
    addStudentDesc: 'Thêm học sinh mới vào nền tảng',
    scheduleSession: 'Lên lịch buổi học',
    scheduleSessionDesc: 'Lên lịch các buổi học mới',
    manageCourses: 'Quản lý khóa học',
    manageCoursesDesc: 'Quản lý nội dung và chương trình học',
    viewCalendar: 'Xem lịch',
    viewCalendarDesc: 'Xem và quản lý các sự kiện trong lịch',
    systemSettings: 'Cài đặt hệ thống',
    systemSettingsDesc: 'Cấu hình tùy chọn hệ thống',
    rescheduleRequest: 'Yêu cầu đổi lịch',
    whyReschedule: 'Tại sao bạn cần đổi lịch?',
    selectNewTime: 'Chọn thời gian mới',
    confirmRequest: 'Xác nhận yêu cầu',
    currentSession: 'Buổi học hiện tại',
    newSession: 'Buổi học mới',
    alternativeTimes: 'Thời gian thay thế',
    addNote: 'Thêm ghi chú',
    submitRequest: 'Gửi yêu cầu',
    cancelRequest: 'Hủy yêu cầu',
    personalEmergency: 'Khẩn cấp cá nhân',
    scheduleConflict: 'Xung đột lịch trình',
    illness: 'Ốm đau',
    other: 'Khác',
    pleaseSpecify: 'Vui lòng nêu rõ lý do...',
    selectDate: 'Chọn ngày',
    selectTime: 'Chọn giờ',
    addAlternative: 'Thêm lựa chọn',
    removeAlternative: 'Xóa lựa chọn',
    requestSubmitted: 'Yêu cầu đã được gửi',
    tutorNotified: 'Gia sư đã được thông báo',
    familyCommitment: 'Cam kết gia đình',
    healthIssue: 'Vấn đề sức khỏe',
    workConflict: 'Xung đột công việc',
    transportationIssue: 'Vấn đề giao thông',
    back: 'Quay lại',
    next: 'Tiếp theo',
    mathDashDashboard: 'Bảng điều khiển MathDash',
    dashboardDescription: 'Hệ thống quản lý gia sư toán học • ∀ dữ liệu ∈ Nền tảng: phân tích(dữ liệu) = thông tin chi tiết',
    overviewAnalytics: '∫ Phân tích tổng quan',
    viewDetails: 'Xem chi tiết',
    analyticsChart: 'Biểu đồ phân tích y = mx + b',
    chartIntegrationComingSoon: '∫ Tích hợp biểu đồ sắp ra mắt',
    packageSelection: 'Chọn gói học',
    selectLearningPackage: 'Chọn gói học tập',
    searchPackages: 'Tìm kiếm gói học...',
    filterBySubject: 'Lọc theo môn học',
    filterByLevel: 'Lọc theo trình độ',
    sortBy: 'Sắp xếp theo',
    allSubjects: 'Tất cả môn học',
    mathematics: 'Toán học',
    physics: 'Vật lý',
    chemistry: 'Hóa học',
    allLevels: 'Tất cả trình độ',
    beginner: 'Cơ bản',
    intermediate: 'Trung bình',
    advanced: 'Nâng cao',
    popular: 'Phổ biến',
    price: 'Giá',
    rating: 'Đánh giá',
    duration: 'Thời lượng',
    sessions: 'Buổi học',
    weeks: 'tuần',
    reviews: 'đánh giá',
    selectPackage: 'Chọn gói',
    enrollNow: 'Đăng ký ngay',
    popularPackage: 'Gói phổ biến',
    recommendedPackage: 'Gói được đề xuất',
    childManagement: 'Quản lý trẻ em',
    advancedChildManagement: 'Quản lý trẻ em nâng cao',
    backToDashboard: 'Quay lại bảng điều khiển',
    addNewChild: 'Thêm trẻ mới',
    editChild: 'Sửa thông tin trẻ',
    deleteChild: 'Xóa trẻ',
    uploadTestFiles: 'Tải lên bài kiểm tra',
    testScores: 'Điểm kiểm tra',
    testFiles: 'Tệp bài kiểm tra',
    uploadDate: 'Ngày tải lên',
    downloadFile: 'Tải xuống tệp',
    removeFile: 'Xóa tệp',
    confirmDeleteChild: 'Bạn có chắc chắn muốn xóa trẻ này?',
    childDeleted: 'Xóa trẻ thành công',
    fileUploaded: 'Tải lên tệp thành công',
    fileRemoved: 'Xóa tệp thành công',
    centerList: 'Danh sách trung tâm',
    learningCenters: 'Trung tâm học tập',
    noCentersFound: 'Không tìm thấy trung tâm nào',
    getStartedCenters: 'Bắt đầu bằng cách thêm trung tâm học tập đầu tiên để quản lý mạng lưới giáo dục',
    tryAdjustingFilters: 'Thử điều chỉnh bộ lọc tìm kiếm hoặc xóa chúng để xem tất cả trung tâm',
    addFirstCenter: 'Thêm trung tâm đầu tiên',
    viewCenter: 'Xem trung tâm',
    editCenter: 'Sửa trung tâm',
    createCenter: 'Tạo trung tâm',
    centerDetails: 'Chi tiết trung tâm',
    centerCapacity: 'Sức chứa trung tâm',
    currentStudents: 'Học sinh hiện tại',
    availableSlots: 'Chỗ trống có sẵn',
    centerRating: 'Đánh giá trung tâm',
    facilities: 'Tiện nghi',
    contactCenter: 'Liên hệ trung tâm',
    tutorRegister: 'Đăng ký gia sư',
    becomeTutor: 'Trở thành gia sư',
    personalInformation: 'Thông tin cá nhân',
    professionalInformation: 'Thông tin chuyên môn',
    documents: 'Tài liệu',
    firstName: 'Tên',
    lastName: 'Họ',
    email: 'Email',
    phone: 'Số điện thoại',
    location: 'Địa chỉ',
    bio: 'Giới thiệu',
    subjects: 'Môn học',
    experience: 'Kinh nghiệm',
    education: 'Học vấn',
    certifications: 'Chứng chỉ',
    hourlyRate: 'Mức lương theo giờ',
    availability: 'Thời gian có sẵn',
    resume: 'CV',
    certificates: 'Chứng chỉ',
    idDocument: 'Giấy tờ tùy thân',
    uploadFile: 'Tải lên tệp',
    removeFile: 'Xóa tệp',
    addEducation: 'Thêm học vấn',
    addCertification: 'Thêm chứng chỉ',
    addAvailability: 'Thêm thời gian',
    nextStep: 'Bước tiếp theo',
    previousStep: 'Bước trước',
    submitApplication: 'Gửi đơn đăng ký',
    applicationSubmitted: 'Đơn đăng ký đã được gửi',
    centerForm: 'Form trung tâm',
    createCenter: 'Tạo trung tâm',
    editCenter: 'Sửa trung tâm',
    centerName: 'Tên trung tâm',
    centerAddress: 'Địa chỉ',
    centerCity: 'Thành phố',
    centerDistrict: 'Quận/Huyện',
    centerPhone: 'Số điện thoại',
    centerEmail: 'Email',
    centerDescription: 'Mô tả',
    centerCapacity: 'Sức chứa',
    centerFacilities: 'Tiện nghi',
    operatingHours: 'Giờ hoạt động',
    monday: 'Thứ Hai',
    tuesday: 'Thứ Ba',
    wednesday: 'Thứ Tư',
    thursday: 'Thứ Năm',
    friday: 'Thứ Sáu',
    saturday: 'Thứ Bảy',
    sunday: 'Chủ Nhật',
    addFacility: 'Thêm tiện nghi',
    removeFacility: 'Xóa tiện nghi',
    saveCenter: 'Lưu trung tâm',
    cancelCenter: 'Hủy',
    centerCreated: 'Tạo trung tâm thành công',
    centerUpdated: 'Cập nhật trung tâm thành công',
    learningProgress: 'Tiến độ học tập',
    trackProgress: 'Theo dõi tiến độ',
    viewDetailedReport: 'Xem báo cáo chi tiết',
    downloadReport: 'Tải xuống báo cáo',
    filterByChild: 'Lọc theo trẻ',
    filterBySubject: 'Lọc theo môn học',
    filterByLevel: 'Lọc theo trình độ',
    allChildren: 'Tất cả trẻ em',
    allSubjects: 'Tất cả môn học',
    allLevels: 'Tất cả trình độ',
    totalSessions: 'Tổng số buổi học',
    completedSessions: 'Buổi học đã hoàn thành',
    averageScore: 'Điểm trung bình',
    improvement: 'Cải thiện',
    lastTestScore: 'Điểm kiểm tra cuối',
    lastTestDate: 'Ngày kiểm tra cuối',
    tutorName: 'Tên gia sư',
    centerName: 'Tên trung tâm',
    testResults: 'Kết quả kiểm tra',
    tutorFeedback: 'Phản hồi từ gia sư',
    nextGoals: 'Mục tiêu tiếp theo',
    performance: 'Hiệu suất',
    attendance: 'Điểm danh',
    homework: 'Bài tập về nhà',
    participation: 'Tham gia',
    overallRating: 'Đánh giá tổng thể',
    excellent: 'Xuất sắc',
    good: 'Tốt',
    satisfactory: 'Đạt yêu cầu',
    needsImprovement: 'Cần cải thiện',
    courseList: 'Danh sách khóa học',
    availableCourses: 'Khóa học có sẵn',
    noCoursesFound: 'Không tìm thấy khóa học nào',
    getStartedCourses: 'Bắt đầu bằng cách thêm khóa học đầu tiên để quản lý nội dung giáo dục',
    tryAdjustingCourseFilters: 'Thử điều chỉnh bộ lọc tìm kiếm hoặc xóa chúng để xem tất cả khóa học',
    addFirstCourse: 'Thêm khóa học đầu tiên',
    viewCourse: 'Xem khóa học',
    editCourse: 'Sửa khóa học',
    createCourse: 'Tạo khóa học',
    enrollCourse: 'Đăng ký khóa học',
    courseDetails: 'Chi tiết khóa học',
    courseCategory: 'Danh mục',
    courseLevel: 'Trình độ',
    courseStatus: 'Trạng thái',
    courseDuration: 'Thời lượng',
    coursePrice: 'Giá',
    courseRating: 'Đánh giá',
    courseStudents: 'Học sinh',
    courseDescription: 'Mô tả',
    courseInstructor: 'Giảng viên',
    courseSchedule: 'Lịch học',
    courseRequirements: 'Yêu cầu',
    courseBenefits: 'Lợi ích',
    enrollNow: 'Đăng ký ngay',
    viewDetails: 'Xem chi tiết',
    editCourse: 'Sửa khóa học',
    deleteCourse: 'Xóa khóa học',
    courseCreated: 'Tạo khóa học thành công',
    courseUpdated: 'Cập nhật khóa học thành công',
    courseDeleted: 'Xóa khóa học thành công',
    tutorList: 'Danh sách gia sư',
    findTutors: 'Tìm gia sư',
    searchTutors: 'Tìm kiếm gia sư...',
    filterTutors: 'Lọc gia sư',
    sortBy: 'Sắp xếp theo',
    allSubjects: 'Tất cả môn học',
    algebra: 'Đại số',
    geometry: 'Hình học',
    calculus: 'Giải tích',
    statistics: 'Thống kê',
    trigonometry: 'Lượng giác',
    preCalculus: 'Tiền giải tích',
    experience: 'Kinh nghiệm',
    rating: 'Đánh giá',
    totalReviews: 'Tổng đánh giá',
    location: 'Địa điểm',
    isVerified: 'Đã xác minh',
    specialties: 'Chuyên môn',
    languages: 'Ngôn ngữ',
    viewProfile: 'Xem hồ sơ',
    bookSession: 'Đặt lịch học',
    sendMessage: 'Gửi tin nhắn',
    yearsExperience: 'năm kinh nghiệm',
    verifiedTutor: 'Gia sư đã xác minh',
    noTutorsFound: 'Không tìm thấy gia sư',
    tryAdjustingTutorFilters: 'Thử điều chỉnh bộ lọc tìm kiếm để xem thêm gia sư',
    walletComponent: 'Thành phần ví',
    myWallet: 'Ví của tôi',
    walletBalance: 'Số dư ví',
    totalDeposits: 'Tổng nạp tiền',
    totalSpent: 'Tổng chi tiêu',
    recentTransactions: 'Giao dịch gần đây',
    deposit: 'Nạp tiền',
    withdrawal: 'Rút tiền',
    payment: 'Thanh toán',
    refund: 'Hoàn tiền',
    completed: 'Hoàn thành',
    pending: 'Đang chờ',
    failed: 'Thất bại',
    addFunds: 'Thêm tiền',
    withdrawFunds: 'Rút tiền',
    transactionHistory: 'Lịch sử giao dịch',
    depositAmount: 'Số tiền nạp',
    depositMethod: 'Phương thức nạp',
    bankTransfer: 'Chuyển khoản ngân hàng',
    creditCard: 'Thẻ tín dụng',
    mobilePayment: 'Thanh toán di động',
    confirmDeposit: 'Xác nhận nạp tiền',
    depositSuccessful: 'Nạp tiền thành công',
    depositFailed: 'Nạp tiền thất bại',
    insufficientFunds: 'Số dư không đủ',
    transactionId: 'Mã giao dịch',
    transactionDate: 'Ngày giao dịch',
    transactionStatus: 'Trạng thái',
    transactionMethod: 'Phương thức',
    noTransactions: 'Không có giao dịch',
    backToDashboard: 'Quay lại bảng điều khiển',
    login: 'Đăng nhập',
    signIn: 'Đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    emailRequired: 'Email là bắt buộc',
    emailInvalid: 'Email không hợp lệ',
    passwordRequired: 'Mật khẩu là bắt buộc',
    passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
    loginFailed: 'Đăng nhập thất bại',
    signInWithGoogle: 'Đăng nhập bằng Google',
    dontHaveAccount: 'Chưa có tài khoản?',
    signUp: 'Đăng ký',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập',
    welcomeBack: 'Chào mừng trở lại',
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    loginSuccess: 'Đăng nhập thành công',
    googleLoginSuccess: 'Đăng nhập Google thành công',
    googleLoginFailed: 'Đăng nhập Google thất bại',
    invalidCredentials: 'Email hoặc mật khẩu không hợp lệ',
    accountLocked: 'Tài khoản bị khóa',
    tooManyAttempts: 'Quá nhiều lần thử',
    emailNotVerified: 'Email chưa được xác minh. Vui lòng kiểm tra email và xác minh tài khoản của bạn.',
    signup: 'Đăng ký',
    createAccount: 'Tạo tài khoản',
    fullName: 'Họ và tên',
    phoneNumber: 'Số điện thoại',
    gender: 'Giới tính',
    confirmPassword: 'Xác nhận mật khẩu',
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
    fullNameRequired: 'Họ và tên là bắt buộc',
    phoneRequired: 'Số điện thoại là bắt buộc',
    genderRequired: 'Giới tính là bắt buộc',
    passwordMismatch: 'Mật khẩu không khớp',
    signupSuccess: 'Đăng ký thành công',
    signupFailed: 'Đăng ký thất bại',
    verificationEmailSent: 'Email xác minh đã được gửi',
    resendVerification: 'Gửi lại xác minh',
    verificationEmailSentAgain: 'Email xác minh đã được gửi lại!',
    failedToResendVerification: 'Không thể gửi lại email xác minh.',
    errorResendingEmail: 'Lỗi khi gửi lại email.',
    alreadyHaveAccount: 'Đã có tài khoản?',
    signInHere: 'Đăng nhập tại đây',
    welcomeToMathBridge: 'Chào mừng đến với MathBridge',
    createYourAccount: 'Tạo tài khoản của bạn',
    accountCreated: 'Tài khoản đã được tạo',
    pleaseVerifyEmail: 'Vui lòng xác minh email của bạn',
    checkYourEmail: 'Kiểm tra email của bạn',
    clickVerificationLink: 'Nhấp vào liên kết xác minh',
    courseCard: 'Thẻ khóa học',
    enrollmentRate: 'Tỷ lệ đăng ký',
    students: 'Học sinh',
    maxStudents: 'Số học sinh tối đa',
    enrolled: 'Đã đăng ký',
    spotsLeft: 'Chỗ còn lại',
    spotsAvailable: 'Chỗ có sẵn',
    enrollmentFull: 'Đã đầy',
    courseStatus: 'Trạng thái khóa học',
    courseLevel: 'Trình độ khóa học',
    coursePrice: 'Giá khóa học',
    courseDuration: 'Thời lượng khóa học',
    courseInstructor: 'Giảng viên',
    courseLocation: 'Địa điểm khóa học',
    courseSchedule: 'Lịch học',
    courseDescription: 'Mô tả khóa học',
    courseRequirements: 'Yêu cầu khóa học',
    courseBenefits: 'Lợi ích khóa học',
    enrollNow: 'Đăng ký ngay',
    viewDetails: 'Xem chi tiết',
    editCourse: 'Sửa khóa học',
    deleteCourse: 'Xóa khóa học',
    courseCreated: 'Khóa học đã được tạo',
    courseUpdated: 'Khóa học đã được cập nhật',
    courseDeleted: 'Khóa học đã được xóa',
    active: 'Đang hoạt động',
    upcoming: 'Sắp diễn ra',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
    beginner: 'Cơ bản',
    intermediate: 'Trung bình',
    advanced: 'Nâng cao',
    free: 'Miễn phí',
    paid: 'Trả phí',
    hours: 'Giờ',
    minutes: 'Phút',
    days: 'Ngày',
    weeks: 'Tuần',
    months: 'Tháng',
    years: 'Năm',
    online: 'Trực tuyến',
    offline: 'Tại lớp',
    hybrid: 'Kết hợp',
    morning: 'Sáng',
    afternoon: 'Chiều',
    evening: 'Tối',
    weekend: 'Cuối tuần',
    weekday: 'Ngày thường',
  },
};

export const useTranslation = () => {
  const { language } = useSettings();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return { t, language };
};
