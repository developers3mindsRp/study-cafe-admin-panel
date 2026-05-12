import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { usersApi, type User } from "../../api/users";
import { plansApi, type Plan } from "../../api/plans";
import { fetchCourses, addBatchEnrollment, fetchUserEnrollments } from "../../api/courses";
import { useAssignCoursesState } from "./hooks/useAssignCoursesState";
import { CourseBatchAssignSection } from "./components/CourseBatchAssignSection";

type UserPayload = Partial<User>;

export default function UserEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);

    const {
        courses,
        setCourses,
        selectedCourseIds,
        batchesMap,
        selectedBatches,
        batchesLoading,
        handleCourseSelectionChange,
        onBatchChange,
        hydrateFromEnrollments,
    } = useAssignCoursesState();

    const [formData, setFormData] = useState<UserPayload>({
        name: "",
        email: "",
        phone: "",
        membership: "",
        status: "active",
        // Profile
        first_name: "",
        last_name: "",
        display_name: "",

        // Location
        city: "",
        state: "",
        country: "",

        // Professional
        profession: "",
        designation: "",
        company: "",
        bio: "",

        // Social
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        youtube: "",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch plans first
                const plansRes = await plansApi.list();
                const activePlans = plansRes.data.filter(p => p.is_active);
                setPlans(activePlans);

                if (id) {
                    const numericId = Number(id);
                    const [user, coursesData, enrollments] = await Promise.all([
                        usersApi.get(id),
                        fetchCourses(),
                        fetchUserEnrollments(numericId),
                    ]);
                    setCourses(coursesData);
                    await hydrateFromEnrollments(enrollments);

                    setFormData({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        membership: user.membership || "",
                        status: user.status || "active",

                        first_name: user.first_name || "",
                        last_name: user.last_name || "",
                        display_name: user.display_name || "",

                        city: user.city || "",
                        state: user.state || "",
                        country: user.country || "",

                        profession: user.profession || "",
                        designation: user.designation || "",
                        company: user.company || "",
                        bio: user.bio || "",

                        facebook: user.facebook || "",
                        twitter: user.twitter || "",
                        linkedin: user.linkedin || "",
                        instagram: user.instagram || "",
                        youtube: user.youtube || "",
                    });
                }
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSubmitting(true);
        setError(null);
        try {
            await usersApi.update(id, formData);
            const userId = Number(id);
            const enrollPromises = Object.entries(selectedBatches)
                .filter(([, batchId]) => Number(batchId) > 0)
                .map(([, batchId]) =>
                    addBatchEnrollment(Number(batchId), userId).catch((err) =>
                        console.error(`Failed to enroll in batch ${batchId}:`, err),
                    ),
                );
            await Promise.all(enrollPromises);
            navigate("/users");
        } catch (err: any) {
            console.error("Update failed", err);
            setError(err.response?.data?.error || "Failed to update user");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <>
            <PageMeta
                title="Edit User | StudyCafe Admin"
                description="Edit user details"
            />
            <PageBreadcrumb pageTitle="Edit User" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                    Edit User
                </h3>
                {error && (
                    <div className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Account Details */}
                    <div>
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-500 rounded-full inline-block"></span>
                            Account Details
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email || ""}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                    required
                                    disabled
                                    hint="Email cannot be changed directly."
                                />
                            </div>
                            <div>
                                <div>
                                    <Label>Membership</Label>
                                    <div className="relative">
                                        <select
                                            name="membership"
                                            value={formData.membership || ""}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                        >
                                            <option value="">Select Plan</option>
                                            {plans.map((plan) => (
                                                <option key={plan.id} value={plan.slug}>
                                                    {plan.name} ({plan.currency} {plan.price})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status || "active"}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Personal Information */}
                    <div>
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-500 rounded-full inline-block"></span>
                            Personal Information
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="md:col-span-2 lg:col-span-1">
                                <Label>Display Name</Label>
                                <Input
                                    type="text"
                                    name="display_name" // fixed name to match state
                                    value={formData.display_name || ""} // use display_name
                                    onChange={handleChange}
                                    placeholder="Full Display Name"
                                />
                            </div>
                            <div>
                                <Label>First Name</Label>
                                <Input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ""}
                                    onChange={handleChange}
                                    placeholder="First Name"
                                />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ""}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ""}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <Label>Bio</Label>
                                <TextArea
                                    rows={4}
                                    placeholder="Short introduction visible on the user profile"
                                    value={formData.bio || ""}
                                    onChange={(value) => setFormData((prev) => ({ ...prev, bio: value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Location */}
                    <div>
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-500 rounded-full inline-block"></span>
                            Location
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label>State</Label>
                                <Input
                                    type="text"
                                    name="state"
                                    value={formData.state || ""}
                                    onChange={handleChange}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <Label>City</Label>
                                <Input
                                    type="text"
                                    name="city"
                                    value={formData.city || ""}
                                    onChange={handleChange}
                                    placeholder="City"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Professional Details */}
                    <div>
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-500 rounded-full inline-block"></span>
                            Professional Details
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <Label>Designation</Label>
                                <Input
                                    type="text"
                                    name="designation"
                                    value={formData.designation || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                            <div>
                                <Label>Company</Label>
                                <Input
                                    type="text"
                                    name="company"
                                    value={formData.company || ""}
                                    onChange={handleChange}
                                    placeholder="Company Name"
                                />
                            </div>
                            <div>
                                <Label>Profession</Label>
                                <Input
                                    type="text"
                                    name="profession"
                                    value={formData.profession || ""}
                                    onChange={handleChange}
                                    placeholder="Profession"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Social Links */}
                    <div>
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-500 rounded-full inline-block"></span>
                            Social Links
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label>LinkedIn</Label>
                                <Input
                                    type="url"
                                    name="linkedin"
                                    value={formData.linkedin || ""}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                            <div>
                                <Label>Twitter (X)</Label>
                                <Input
                                    type="url"
                                    name="twitter"
                                    value={formData.twitter || ""}
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/username"
                                />
                            </div>
                            <div>
                                <Label>Facebook</Label>
                                <Input
                                    type="url"
                                    name="facebook"
                                    value={formData.facebook || ""}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                            <div>
                                <Label>Instagram</Label>
                                <Input
                                    type="url"
                                    name="instagram"
                                    value={formData.instagram || ""}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/username"
                                />
                            </div>
                            <div>
                                <Label>YouTube</Label>
                                <Input
                                    type="url"
                                    name="youtube"
                                    value={formData.youtube || ""}
                                    onChange={handleChange}
                                    placeholder="https://youtube.com/@channel"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <CourseBatchAssignSection
                        courses={courses}
                        selectedCourseIds={selectedCourseIds}
                        onCourseSelectionChange={handleCourseSelectionChange}
                        batchesMap={batchesMap}
                        selectedBatches={selectedBatches}
                        onBatchChange={onBatchChange}
                        batchesLoading={batchesLoading}
                        description="Search and select courses, pick a batch for each, then save — new or updated batch enrollments are applied after the profile is saved."
                    />

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/users")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
