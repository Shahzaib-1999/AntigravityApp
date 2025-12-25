import Layout from "./Layout.jsx";

import Home from "./Home";

import JobDetail from "./JobDetail";

import PostJob from "./PostJob";

import Profile from "./Profile";

import Messages from "./Messages";

import LookingForJob from "./LookingForJob";

import JobSeekersList from "./JobSeekersList";

import JobsList from "./JobsList";

import MyLogin from "./MyLogin";

import MySignup from "./MySignup";

import EditJob from "./EditJob";

import EmployerDashboard from "./EmployerDashboard";

import JobSeekerProfile from "./JobSeekerProfile";

import ContactUs from "./ContactUs";
import AdminDashboard from "./AdminDashboard";
import GoogleTest from "./GoogleTest";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {

    Home: Home,

    JobDetail: JobDetail,

    PostJob: PostJob,

    Profile: Profile,

    Messages: Messages,

    LookingForJob: LookingForJob,

    JobSeekersList: JobSeekersList,

    JobsList: JobsList,

    MyLogin: MyLogin,

    MySignup: MySignup,

    EditJob: EditJob,

    EmployerDashboard: EmployerDashboard,

    JobSeekerProfile: JobSeekerProfile,

    ContactUs: ContactUs,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>

                <Route path="/" element={<Home />} />


                <Route path="/Home" element={<Home />} />

                <Route path="/JobDetail" element={<JobDetail />} />

                <Route path="/PostJob" element={<PostJob />} />

                <Route path="/Profile" element={<Profile />} />

                <Route path="/Messages" element={<Messages />} />

                <Route path="/LookingForJob" element={<LookingForJob />} />

                <Route path="/JobSeekersList" element={<JobSeekersList />} />

                <Route path="/JobsList" element={<JobsList />} />

                <Route path="/MyLogin" element={<MyLogin />} />

                <Route path="/MySignup" element={<MySignup />} />

                <Route path="/EditJob" element={<EditJob />} />

                <Route path="/EmployerDashboard" element={<EmployerDashboard />} />

                <Route path="/JobSeekerProfile" element={<JobSeekerProfile />} />

                <Route path="/ContactUs" element={<ContactUs />} />
                <Route path="/GoogleTest" element={<GoogleTest />} />
                <Route path="/admin" element={<AdminDashboard />} />

            </Routes>
        </Layout>
    );
}

import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function Pages() {
    return (
        <Router>
            <GoogleAnalytics />
            <PagesContent />
        </Router>
    );
}