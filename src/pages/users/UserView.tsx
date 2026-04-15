import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import { usersApi, type User } from "../../api/users";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { PencilIcon } from "../../icons";

export default function UserView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadUser(id);
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
                            <div className="mt-2">
                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 capitalize">
                                    {user?.membership || "Free"}
                                </span>
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
