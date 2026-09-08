import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { usersApi, fetchUserMemberships, type User } from "../../api/users";
import { plansApi, type Plan } from "../../api/plans";
import { api } from "../../api/axios";
import {
    fetchCourses,
    setUserCourseBatch,
    fetchUserEnrollments,
    removeUserCourseAllotment,
} from "../../api/courses";
import { useAssignCoursesState } from "./hooks/useAssignCoursesState";
import { CourseBatchAssignSection } from "./components/CourseBatchAssignSection";
import { FREE_MEMBERSHIP_VALUE } from "./constants/userMembershipOptions";
import { toast } from "react-toastify";

type UserPayload = Partial<User>;

interface PlanFields {
    price: string;
    payment_id: string;
    plan_purchased: string;
    plan_expiry: string;
}

function toDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function UserEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [originalMembership, setOriginalMembership] = useState<string>("");
    const [planFields, setPlanFields] = useState<PlanFields>({
        price: "",
        payment_id: "",
        plan_purchased: toDatetimeLocal(new Date()),
        plan_expiry: "",
    });

    const {
        courses,
        setCourses,
        selectedCourseIds,
        batchesMap,
        selectedBatches,
        batchesLoading,
        coursePrices,
        coursePaymentIds,
        removedCourseIds,
        handleCourseSelectionChange,
        onBatchChange,
        onPriceChange,
        onPaymentIdChange,
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

        // Tax
        gst: "",
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
                    const [user, coursesData, enrollmentsRes, memberships] = await Promise.all([
                        usersApi.get(id),
                        fetchCourses(),
                        fetchUserEnrollments(numericId),
                        fetchUserMemberships(id),
                    ]);
                    setCourses(coursesData);
                    // Flatten active + expired into a single array for the course assignment hydrator.
                    const allEnrollments = [
                        ...enrollmentsRes.active_courses,
                        ...enrollmentsRes.expired_courses,
                    ];
                    await hydrateFromEnrollments(allEnrollments);

                    // Resolve active membership from user_memberships (canonical source)
                    const now = new Date();
                    const activeMembership = memberships
                        .filter(m => m.expires_at && new Date(m.expires_at) > now)
                        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0];
                    const activeMembershipType = activeMembership?.membership_type || "";
                    setOriginalMembership(activeMembershipType);

                    // Pre-fill plan fields from existing users.plan JSON if present
                    if (user.plan && typeof user.plan === "string") {
                        try {
                            const existing = JSON.parse(user.plan);
                            if (existing && typeof existing === "object") {
                                setPlanFields({
                                    price: existing.price || "",
                                    payment_id: existing.payment_id || "",
                                    plan_purchased: existing.plan_purchased || toDatetimeLocal(new Date()),
                                    plan_expiry: existing.plan_expiry || "",
                                });
                            }
                        } catch {
                            // plan is a plain slug string, leave defaults
                        }
                    }

                    setFormData({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        // Fall back to the "Free" sentinel so users with no active plan
                        // show as Free (not a blank "Select Plan") in the dropdown.
                        membership: activeMembershipType || FREE_MEMBERSHIP_VALUE,
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

                        gst: user.gst || "",
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
        if (name === "membership") {
            const selected = plans.find(p => p.slug === value);
            if (selected) {
                const startDate = planFields.plan_purchased
                    ? new Date(planFields.plan_purchased.replace(" ", "T"))
                    : new Date();
                const from = isNaN(startDate.getTime()) ? new Date() : startDate;
                const expiry = (selected.is_lifetime || !selected.duration_days)
                    ? new Date(from.getFullYear() + 10, from.getMonth(), from.getDate())
                    : new Date(from.getTime() + selected.duration_days * 24 * 60 * 60 * 1000);
                setPlanFields(prev => ({ ...prev, plan_expiry: toDatetimeLocal(expiry) }));
            } else {
                setPlanFields(prev => ({ ...prev, plan_expiry: "" }));
            }
        }
    };

    const handlePlanFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPlanFields(prev => ({ ...prev, [name]: value }));
    };

    /** Titles for the confirm dialog — ids alone tell the admin nothing about what they're dropping. */
    const removedCourseTitles = removedCourseIds.map((cId) => {
        const match = courses.find((c) => c.id === cId);
        return match?.title || `Course #${cId}`;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        // Deallotment deletes the batch enrollment, the course enrollment and the access
        // grant. There is no undo, so it is the one part of this form that asks first.
        if (removedCourseIds.length > 0) {
            const list = removedCourseTitles.map((t) => `  • ${t}`).join("\n");
            const confirmed = window.confirm(
                `Remove ${removedCourseIds.length} course${removedCourseIds.length !== 1 ? "s" : ""} from this user?\n\n${list}\n\n` +
                "This deletes their batch enrollment and access. Any order and payment records are kept, " +
                "so the purchase still shows in their history.\n\nThis cannot be undone.",
            );
            if (!confirmed) return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await usersApi.update(id, formData);
            const userId = Number(id);

            const newMembership = formData.membership || "";
            const membershipChanged = newMembership && newMembership !== originalMembership;

            if (newMembership === FREE_MEMBERSHIP_VALUE) {
                // Admin downgraded the user to Free. Only hit the API when the user
                // actually had an active paid membership to remove.
                if (originalMembership) {
                    await api.delete(`/admin/users/${id}/membership`);
                    setOriginalMembership("");
                    setPlanFields({
                        price: "",
                        payment_id: "",
                        plan_purchased: toDatetimeLocal(new Date()),
                        plan_expiry: "",
                    });
                }
            } else if (newMembership) {
                const startDate = planFields.plan_purchased
                    ? new Date(planFields.plan_purchased.replace(" ", "T"))
                    : new Date();
                const from = isNaN(startDate.getTime()) ? new Date() : startDate;
                const matchedPlan = plans.find(p => p.slug === newMembership);
                let expiryDate: Date;
                if (matchedPlan) {
                    expiryDate = matchedPlan.is_lifetime || !matchedPlan.duration_days
                        ? new Date(from.getFullYear() + 10, from.getMonth(), from.getDate())
                        : new Date(from.getTime() + Number(matchedPlan.duration_days) * 24 * 60 * 60 * 1000);
                } else {
                    expiryDate = new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);
                }
                const planValidity = matchedPlan && !matchedPlan.is_lifetime && matchedPlan.duration_days
                    ? String(matchedPlan.duration_days)
                    : undefined;

                if (membershipChanged) {
                    // Full re-grant: creates a new user_memberships row + updates users.plan
                    await api.post(`/admin/users/${id}/membership`, {
                        membershipType: newMembership,
                        startsAt: from.toISOString(),
                        expiresAt: expiryDate.toISOString(),
                        price: planFields.price || undefined,
                        paymentId: planFields.payment_id || undefined,
                        planValidity,
                        planPurchasedFormatted: planFields.plan_purchased || undefined,
                        planExpiryFormatted: planFields.plan_expiry || toDatetimeLocal(expiryDate),
                    });
                } else {
                    // Same plan — only update the plan JSON on users.plan (payment details changed)
                    const planJson = {
                        price: planFields.price || undefined,
                        plan_validity: planValidity,
                        plan_purchased: planFields.plan_purchased || toDatetimeLocal(from),
                        plan_expiry: planFields.plan_expiry || toDatetimeLocal(expiryDate),
                        payment_id: planFields.payment_id || undefined,
                    };
                    await usersApi.update(id, { plan: JSON.stringify(planJson) });
                }
            }

            // Atomically set exactly one batch per selected course. setUserCourseBatch removes any
            // other batch of the same course first, so switching a user's batch never leaves them
            // enrolled in two batches at once (the "2 batches show" bug).
            const failures: string[] = [];

            // Deallot first. Running removals before the set-batch calls means a course the
            // admin removed and re-added in the same edit ends up enrolled, not dropped.
            for (const cId of removedCourseIds) {
                try {
                    await removeUserCourseAllotment(userId, cId);
                } catch (err) {
                    const title = courses.find((c) => c.id === cId)?.title || `course ${cId}`;
                    console.error(`Failed to remove course ${cId}:`, err);
                    failures.push(`Could not remove ${title}`);
                }
            }

            const enrollPromises = Object.entries(selectedBatches)
                .filter(([, batchId]) => Number(batchId) > 0)
                .map(([courseIdStr, batchId]) => {
                    const cId = Number(courseIdStr);
                    return setUserCourseBatch(cId, Number(batchId), userId, {
                        price: coursePrices[cId]?.trim() || undefined,
                        paymentId: coursePaymentIds[cId]?.trim() || undefined,
                    }).catch((err) => {
                        const title = courses.find((c) => c.id === cId)?.title || `course ${cId}`;
                        console.error(`Failed to set batch ${batchId} for course ${cId}:`, err);
                        failures.push(`Could not assign ${title}`);
                    });
                });
            await Promise.all(enrollPromises);

            // Re-read the server's view so the chips reflect what was actually saved —
            // a removal that failed reappears instead of looking as though it worked.
            try {
                const refreshed = await fetchUserEnrollments(userId);
                await hydrateFromEnrollments([
                    ...refreshed.active_courses,
                    ...refreshed.expired_courses,
                ]);
            } catch (err) {
                console.error("Failed to refresh enrollments after save", err);
            }

            // Course changes are applied per course, so a failure here does not undo the
            // profile update that already succeeded — say what worked and what didn't
            // rather than reporting a clean save.
            if (failures.length > 0) {
                setError(`${failures.join(". ")}. Other changes were saved.`);
                toast.error(`Saved with ${failures.length} course error${failures.length !== 1 ? "s" : ""}`);
            } else {
                toast.success("User updated successfully!");
            }
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
                            <div className="md:col-span-2">
                                <Label>Membership</Label>
                                <div className="relative">
                                    <select
                                        name="membership"
                                        value={formData.membership || ""}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Plan</option>
                                        <option value={FREE_MEMBERSHIP_VALUE}>Free (No membership)</option>
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.slug}>
                                                {plan.name} ({plan.currency} {plan.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formData.membership === FREE_MEMBERSHIP_VALUE && originalMembership && (
                                    <p className="mt-1.5 text-xs text-warning-600 dark:text-warning-400">
                                        Saving will remove this user's active membership and downgrade them to Free.
                                    </p>
                                )}
                            </div>

                            {formData.membership && formData.membership !== FREE_MEMBERSHIP_VALUE && (
                                <>
                                    <div>
                                        <Label>Price</Label>
                                        <Input
                                            type="text"
                                            name="price"
                                            value={planFields.price}
                                            onChange={handlePlanFieldChange}
                                            placeholder="eg. 3999"
                                        />
                                    </div>
                                    <div>
                                        <Label>Date of Purchase</Label>
                                        <Input
                                            type="text"
                                            name="plan_purchased"
                                            value={planFields.plan_purchased}
                                            onChange={handlePlanFieldChange}
                                            placeholder="YYYY-MM-DD HH:MM"
                                        />
                                    </div>
                                    <div>
                                        <Label>Plan Expiry</Label>
                                        <Input
                                            type="text"
                                            name="plan_expiry"
                                            value={planFields.plan_expiry}
                                            onChange={handlePlanFieldChange}
                                            placeholder="Auto-computed from plan duration"
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Auto-filled from plan duration. Edit if needed.
                                        </p>
                                    </div>
                                    <div>
                                        <Label>RazorPay Payment ID</Label>
                                        <Input
                                            type="text"
                                            name="payment_id"
                                            value={planFields.payment_id}
                                            onChange={handlePlanFieldChange}
                                            placeholder="Payment ID"
                                        />
                                    </div>
                                </>
                            )}
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
                                    // Bind to `name` (the field shown in the users list and detail
                                    // view). `display_name` is empty for most users, so binding to it
                                    // left this input blank even when the user had a name.
                                    name="name"
                                    value={formData.name || ""}
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
                            <div>
                                <Label>GST Number <span className="text-gray-400 text-xs font-normal">(Optional)</span></Label>
                                <Input
                                    type="text"
                                    name="gst"
                                    value={formData.gst || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 22AAAAA0000A1Z5"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    15-character GSTIN — leave blank if not applicable.
                                </p>
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
                                    type="text"
                                    name="linkedin"
                                    value={formData.linkedin || ""}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                            <div>
                                <Label>Twitter (X)</Label>
                                <Input
                                    type="text"
                                    name="twitter"
                                    value={formData.twitter || ""}
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/username"
                                />
                            </div>
                            <div>
                                <Label>Facebook</Label>
                                <Input
                                    type="text"
                                    name="facebook"
                                    value={formData.facebook || ""}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                            <div>
                                <Label>Instagram</Label>
                                <Input
                                    type="text"
                                    name="instagram"
                                    value={formData.instagram || ""}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/username"
                                />
                            </div>
                            <div>
                                <Label>YouTube</Label>
                                <Input
                                    type="text"
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
                        coursePrices={coursePrices}
                        coursePaymentIds={coursePaymentIds}
                        onPriceChange={onPriceChange}
                        onPaymentIdChange={onPaymentIdChange}
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
