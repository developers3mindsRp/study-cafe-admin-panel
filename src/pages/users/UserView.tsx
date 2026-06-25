import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import { usersApi, fetchUserMemberships, type User, type UserMembership } from "../../api/users";
import { fetchUserEnrollments, type UserEnrollmentRecord, type UserEnrollmentsResponse } from "../../api/courses";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { PencilIcon } from "../../icons";

const EMPTY_ENROLLMENTS: UserEnrollmentsResponse = {
    active_count: 0,
    expired_count: 0,
    total_count: 0,
    active_courses: [],
    expired_courses: [],
};

function CourseTable({ courses, dimmed = false }: { courses: UserEnrollmentRecord[]; dimmed?: boolean }) {
    const fmt = (d: string | null | undefined) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—";

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${dimmed ? "opacity-75" : ""}`}>
            <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">#</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Course</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Batch</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Purchased On</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Expiry</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Order</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {courses.map((enrollment, idx) => {
                        const isExpired = enrollment.access_status === "expired";
                        const isAdminGranted = enrollment.is_admin_granted;
                        const rowKey = enrollment.order_id
                            ? `order-${enrollment.order_id}`
                            : enrollment.enrollment_id != null
                            ? `enroll-${enrollment.enrollment_id}`
                            : `course-${enrollment.course_id ?? idx}-${idx}`;

                        return (
                            <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                    {enrollment.course_title ?? (
                                        <span className="italic text-gray-400">Unknown</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {isAdminGranted ? (
                                        <Badge size="sm" color="warning">Admin Granted</Badge>
                                    ) : isExpired ? (
                                        <Badge size="sm" color="error">Expired</Badge>
                                    ) : (
                                        <Badge size="sm" color="success">Active</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                    {enrollment.batch_name ?? <span className="italic text-gray-400">—</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    {fmt(enrollment.enrolled_at)}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    {enrollment.access_expires_at
                                        ? fmt(enrollment.access_expires_at)
                                        : enrollment.access_status === "active"
                                        ? <span className="text-success-600 dark:text-success-400 font-medium">Lifetime</span>
                                        : "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                                    {enrollment.order_id ?? <span className="italic">—</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function UserView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrollmentsData, setEnrollmentsData] = useState<UserEnrollmentsResponse>(EMPTY_ENROLLMENTS);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
    const [memberships, setMemberships] = useState<UserMembership[]>([]);
    const [membershipsLoading, setMembershipsLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadUser(id);
            loadEnrollments(id);
            loadMemberships(id);
        }
    }, [id]);

    const loadUser = async (userId: string) => {
        try {
            setLoading(true);
            const data = await usersApi.get(userId);
            setUser(data);
        } catch (err: any) {
            setError(err.message || "Failed to load user");
        } finally {
            setLoading(false);
        }
    };

    const loadEnrollments = async (userId: string) => {
        try {
            setEnrollmentsLoading(true);
            const data = await fetchUserEnrollments(Number(userId));
            setEnrollmentsData(data);
        } catch {
            // silently fail — not critical
        } finally {
            setEnrollmentsLoading(false);
        }
    };

    const loadMemberships = async (userId: string) => {
        try {
            setMembershipsLoading(true);
            const data = await fetchUserMemberships(userId);
            setMemberships(data);
        } catch {
            // silently fail — not critical
        } finally {
            setMembershipsLoading(false);
        }
    };

    const now = new Date();

    const activeMemberships = memberships.filter((m) => new Date(m.expires_at) > now);
    const expiredMemberships = memberships.filter((m) => new Date(m.expires_at) <= now);

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!user && !loading) return <div className="p-6 text-center">User not found</div>;

    const InfoBlock = ({ label, value, type = "text" }: { label: string; value?: string; type?: "text" | "link" }) => (
        <div>
            <Label>{label}</Label>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 min-h-[46px] flex items-center">
                {value ? (
                    type === "link" ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline truncate">
                            {value}
                        </a>
                    ) : (
                        <span>{value}</span>
                    )
                ) : (
                    <span className="text-gray-400 italic">Not set</span>
                )}
            </div>
        </div>
    );

    return (
        <>
            <PageMeta
                title="View User | StudyCafe Admin"
                description="View user details"
            />
            <PageBreadcrumb pageTitle="View User" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        User Details
                    </h3>
                    <Button
                        onClick={() => navigate(`/users/${id}/edit`)}
                        startIcon={<PencilIcon className="size-4" />}
                    >
                        Edit User
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Account & Status */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Label>Membership</Label>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {membershipsLoading ? (
                                    <span className="text-sm text-gray-400">Loading…</span>
                                ) : activeMemberships.length > 0 ? (
                                    activeMemberships.map((m) => (
                                        <span
                                            key={m.id}
                                            className="inline-flex rounded-full bg-success-100 px-3 py-1 text-sm font-medium capitalize text-success-700 dark:bg-success-500/10 dark:text-success-400"
                                        >
                                            {m.membership_type}
                                        </span>
                                    ))
                                ) : (
                                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        Free
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <div className="mt-2">
                                <Badge
                                    size="sm"
                                    color={user?.status === "active" ? "success" : "warning"}
                                >
                                    {user?.status || "Active"}
                                </Badge>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <InfoBlock label="Email" value={user?.email} />
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Personal Info */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Personal Information
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <InfoBlock label="Display Name" value={user?.name} />
                            <InfoBlock label="First Name" value={user?.first_name} />
                            <InfoBlock label="Last Name" value={user?.last_name} />
                            <InfoBlock label="Phone" value={user?.phone} />
                        </div>
                        <div className="md:col-span-2 lg:col-span-4">
                            <Label>Bio</Label>
                            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 min-h-[80px] whitespace-pre-wrap">
                                {user?.bio?.trim() ? (
                                    <span>{user.bio}</span>
                                ) : (
                                    <span className="text-gray-400 italic">Not set</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Location */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Location
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <InfoBlock label="City" value={user?.city} />
                            <InfoBlock label="State" value={user?.state} />
                            <InfoBlock label="Country" value={user?.country} />
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Professional */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Professional Details
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <InfoBlock label="Designation" value={user?.designation} />
                            <InfoBlock label="Company" value={user?.company} />
                            <InfoBlock label="Profession" value={user?.profession} />
                            <InfoBlock label="GST Number" value={user?.gst ?? undefined} />
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Social */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Social Links
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoBlock label="LinkedIn" value={user?.linkedin} type="link" />
                            <InfoBlock label="Twitter (X)" value={user?.twitter} type="link" />
                            <InfoBlock label="Facebook" value={user?.facebook} type="link" />
                            <InfoBlock label="Instagram" value={user?.instagram} type="link" />
                            <InfoBlock label="YouTube" value={user?.youtube} type="link" />
                        </div>
                    </div>


                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Memberships */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Memberships
                        </h4>
                        {membershipsLoading ? (
                            <p className="text-sm text-gray-400">Loading memberships…</p>
                        ) : memberships.length === 0 ? (
                            <p className="text-sm italic text-gray-400">No membership records. User is on Free plan.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-white/[0.03]">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">#</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Plan</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Starts</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Expired At</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Order ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {memberships.map((m, idx) => {
                                            const isActive = new Date(m.expires_at) > now;
                                            return (
                                                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-medium capitalize text-gray-900 dark:text-white">
                                                        {m.membership_type}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge size="sm" color={isActive ? "success" : "error"}>
                                                            {isActive ? "Active" : "Expired"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                        {new Date(m.starts_at).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                        {new Date(m.expires_at).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                        {m.order_id ?? <span className="italic">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {expiredMemberships.length > 0 && activeMemberships.length === 0 && (
                                    <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        All memberships have expired. User currently has no active plan.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Course History */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Course History
                            </h4>
                            {!enrollmentsLoading && enrollmentsData.total_count > 0 && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {enrollmentsData.total_count} total record{enrollmentsData.total_count !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {enrollmentsLoading ? (
                            <p className="text-sm text-gray-400">Loading course history...</p>
                        ) : enrollmentsData.total_count === 0 ? (
                            <p className="text-sm text-gray-400 italic">No courses enrolled yet.</p>
                        ) : (
                            <div className="space-y-6">
                                {/* Active Courses */}
                                {enrollmentsData.active_count > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-sm font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">
                                                Active Courses ({enrollmentsData.active_count})
                                            </span>
                                        </div>
                                        <CourseTable courses={enrollmentsData.active_courses} />
                                    </div>
                                )}

                                {/* Expired Courses */}
                                {enrollmentsData.expired_count > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full bg-error-50 px-3 py-1 text-sm font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-400">
                                                Expired Courses ({enrollmentsData.expired_count})
                                            </span>
                                        </div>
                                        <CourseTable courses={enrollmentsData.expired_courses} dimmed />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/users")}
                        >
                            Back to List
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
