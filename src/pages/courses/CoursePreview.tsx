import { Link, useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import type { CourseFormData } from "./CourseForm";
import { getImageUrl } from "../../utils/image.utils";

export const COURSE_PREVIEW_STATE_KEY = "previewCourse";
export const COURSE_RESTORE_STATE_KEY = "restoreCourseFormData";

export default function CoursePreview() {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.[COURSE_PREVIEW_STATE_KEY] as CourseFormData | undefined;
    const returnPath = (location.state?.returnPath as string) || "/courses/create";

    const handleBack = () => {
        if (data) {
            navigate(returnPath, {
                state: { [COURSE_RESTORE_STATE_KEY]: data },
                replace: true,
            });
        } else {
            navigate("/courses");
        }
    };

    if (!data) {
        return (
            <>
                <PageMeta title="Preview | StudyCafe Admin" description="Course preview" />
                <div className="flex min-h-screen flex-col items-center justify-center p-8">
                    <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-8 text-center">
                        <p className="text-gray-500">No preview data. Create or edit a course and click Preview.</p>
                        <Link to="/courses" className="mt-4 inline-block text-brand-500 hover:underline">Back to Courses</Link>
                    </div>
                </div>
            </>
        );
    }

    const curriculum = data.curriculum ?? [];
    const learnOutcomes = data.learn_outcomes ?? [];
    const faqs = data.faqs ?? [];
    const feedback = data.feedback ?? [];
    const termsConditions = data.terms_conditions ?? [];
    const bonusesInfo = data.includes_info ?? [];
    const courseIncludesBanner = data.course_includes ?? [];

    return (
        <>
            <PageMeta title={`Preview: ${data.title || "Untitled"} | StudyCafe Admin`} description="Course preview" />

            {/* Preview banner */}
            <div className="sticky top-0 z-50 border-b border-gray-300 dark:border-gray-700 backdrop-blur bg-white/80 dark:bg-gray-900/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600">Preview Mode</span>
                        <span className="text-sm text-gray-500">Changes not saved</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={handleBack} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                            Back to Editor
                        </button>
                        <Link to="/courses" className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-300 dark:hover:bg-gray-600">
                            All Courses
                        </Link>
                    </div>
                </div>
            </div>

            {/* Course detail layout — mirrors the live page */}
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Left: Main content */}
                    <div className="flex-1 lg:max-w-3xl space-y-8">

                        {/* Hero */}
                        <section>
                            <p className="text-sm text-brand-500 font-medium mb-2">{data.course_type || "Course"}</p>
                            <h1 className="text-2xl font-bold leading-tight md:text-3xl text-gray-900 dark:text-white">{data.title || "Untitled Course"}</h1>
                            {data.brief_description && (
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{data.brief_description}</p>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                {data.sale_price ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.sale_price}</span>
                                        <span className="text-lg text-gray-400 line-through">₹{data.price}</span>
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.price || "0"}</span>
                                )}
                            </div>
                            {data.thumbnail_url && (
                                <img src={data.thumbnail_url} alt={data.title} className="mt-6 w-full rounded-xl object-cover" referrerPolicy="no-referrer" loading="lazy" />
                            )}
                        </section>

                        {/* Key Features */}
                        {learnOutcomes.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Key Features</h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {learnOutcomes.map((item: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                                            <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: item }} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Course Description */}
                        {data.description && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Description</h2>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: data.description }} />
                            </section>
                        )}

                        {/* Curriculum */}
                        {curriculum.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Content</h2>
                                <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800">
                                    {curriculum.map((item: any, i: number) => (
                                        <div key={i} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-gray-800 dark:text-white/90">
                                                    {/* <span className="text-brand-500 mr-2">Day {i + 1}:</span> */}
                                                    {item.title}
                                                </h3>
                                                {item.minutes && <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{item.minutes} min</span>}
                                            </div>
                                            {item.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {data.certifications && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Certificate</h2>
                                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                    <p className="text-gray-700 dark:text-gray-300">{data.certifications}</p>
                                </div>
                            </section>
                        )}

                        {/* Feedback / Reviews */}
                        {feedback.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reviews of Course Participants</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {feedback.map((fb: any, i: number) => (
                                        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">"{fb.review}"</p>
                                            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                                                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300 text-xs font-bold">
                                                    {(fb.name || "?")[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{fb.name}</p>
                                                    {fb.designation && <p className="text-xs text-gray-500">{fb.designation}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Alumni logos placeholder */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Our Alumni at Leading Companies</h2>
                            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                                <p className="text-sm text-gray-500">Managed globally in Courses → Page Settings</p>
                            </div>
                        </section>

                        {/* FAQs */}
                        {faqs.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">FAQ</h2>
                                <div className="space-y-3">
                                    {faqs.map((faq: any, i: number) => (
                                        <details key={i} className="group rounded-xl border border-gray-200 dark:border-gray-800">
                                            <summary className="cursor-pointer p-4 font-medium text-gray-800 dark:text-white/90 select-none">
                                                {faq.question}
                                            </summary>
                                            <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">{faq.answer}</div>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Terms & Conditions */}
                        {termsConditions.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Terms and Conditions</h2>
                                <ul className="space-y-2 list-disc pl-5">
                                    {termsConditions.map((item: any, i: number) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: item.title || item }} />
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Requirements */}
                        {data.requirements && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h2>
                                <p className="text-gray-700 dark:text-gray-300">{data.requirements}</p>
                            </section>
                        )}

                        {/* Featured In placeholder */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Featured In</h2>
                            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                                <p className="text-sm text-gray-500">Managed globally in Courses → Page Settings</p>
                            </div>
                        </section>

                        {/* Trending Courses placeholder */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trending Courses</h2>
                            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                                <p className="text-sm text-gray-500">Managed globally in Courses → Page Settings</p>
                            </div>
                        </section>
                    </div>

                    {/* Right: Sidebar */}
                    <aside className="w-full lg:w-80 space-y-6">
                        {courseIncludesBanner.length > 0 && (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">This course includes:</h3>
                                <ul className="space-y-3">
                                    {courseIncludesBanner.map((item: any, i: number) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            {item.image && (
                                                <img src={getImageUrl(item.image)} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                                            )}
                                            <span dangerouslySetInnerHTML={{ __html: item.title || "" }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bonusesInfo.length > 0 && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 p-5 bg-amber-50/30 dark:bg-amber-950/20">
                                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Exclusive bonuses</h3>
                                <ul className="space-y-3">
                                    {bonusesInfo.map((item: any, i: number) => (
                                        <li key={i} className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            {item.image && (
                                                <img src={getImageUrl(item.image)} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
                                            )}
                                            <span dangerouslySetInnerHTML={{ __html: item.title || "" }} />
                                            {item.worth && <span className="text-green-600 font-semibold text-xs">Worth {item.worth}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                            <div className="mb-3">
                                {data.sale_price ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.sale_price}</span>
                                        <span className="text-lg text-gray-400 line-through">₹{data.price}</span>
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.price || "0"}</span>
                                )}
                            </div>
                            <button className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white">
                                Buy Now
                            </button>
                        </div>

                        {/* Share icons placeholder */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                            <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Share</h3>
                            <div className="flex gap-3">
                                {["Facebook", "Twitter", "WhatsApp", "LinkedIn"].map(name => (
                                    <span key={name} className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                                        {name[0]}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Author placeholder */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                            <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">About the Author</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white/90">Author Name</p>
                                    <p className="text-xs text-gray-500">Author info loaded at runtime</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
