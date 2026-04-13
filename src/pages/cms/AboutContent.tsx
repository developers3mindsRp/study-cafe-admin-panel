import { useState, useEffect, type ReactNode } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import RichTextEditor from "../../components/form/RichTextEditor";
import Button from "../../components/ui/button/Button";
import ImageUpload from "../../components/form/ImageUpload";
import { fetchCmsPageBySlug, updateCmsPage } from "../../api/cmsPages";
import {
  DEFAULT_ABOUT_PAGE_DATA,
  mergeAboutPageFromCmsRecord,
  aboutPageDataToMetaPayload,
  type AboutPageData,
  type Milestone,
  type StatItem,
  type MissionCard,
  type TeamMember,
  type LeaderPerson,
} from "./aboutPageCms";

const SLUG = "about";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function AboutContent() {
  const [data, setData] = useState<AboutPageData>(() =>
    JSON.parse(JSON.stringify(DEFAULT_ABOUT_PAGE_DATA)) as AboutPageData
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCmsPageBySlug(SLUG)
      .then((row) => {
        if (cancelled) return;
        setData(mergeAboutPageFromCmsRecord(row));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    setSaving(true);
    updateCmsPage(SLUG, {
      title: data.pageTitle,
      content: data.description.bodyHtml,
      meta: aboutPageDataToMetaPayload(data),
    })
      .then(() => setSaving(false))
      .catch(() => setSaving(false));
  };

  const setStat = (index: number, patch: Partial<StatItem>) => {
    setData((prev) => {
      const stats = [...prev.stats];
      stats[index] = { ...stats[index], ...patch };
      return { ...prev, stats };
    });
  };

  const setMilestone = (index: number, patch: Partial<Milestone>) => {
    setData((prev) => {
      const milestones = [...prev.journey.milestones];
      milestones[index] = { ...milestones[index], ...patch };
      return { ...prev, journey: { ...prev.journey, milestones } };
    });
  };

  const setMissionCard = (index: 0 | 1, patch: Partial<MissionCard>) => {
    setData((prev) => {
      const cards: [MissionCard, MissionCard] = [...prev.mission.cards];
      cards[index] = { ...cards[index], ...patch };
      return { ...prev, mission: { ...prev.mission, cards } };
    });
  };

  const setLeader = (index: number, patch: Partial<LeaderPerson>) => {
    setData((prev) => {
      const leaders = [...prev.leadership.leaders];
      leaders[index] = { ...leaders[index], ...patch };
      return { ...prev, leadership: { ...prev.leadership, leaders } };
    });
  };

  const setManager = (index: number, patch: Partial<TeamMember>) => {
    setData((prev) => {
      const members = [...prev.managers.members];
      members[index] = { ...members[index], ...patch };
      return { ...prev, managers: { ...prev.managers, members } };
    });
  };

  const setTeamMember = (index: number, patch: Partial<TeamMember>) => {
    setData((prev) => {
      const members = [...prev.team.members];
      members[index] = { ...members[index], ...patch };
      return { ...prev, team: { ...prev.team, members } };
    });
  };

  const setAwardImage = (index: number, url: string) => {
    setData((prev) => {
      const images = [...prev.awards.images];
      images[index] = url;
      return { ...prev, awards: { ...prev.awards, images } };
    });
  };

  const setFeaturedLogo = (index: number, url: string) => {
    setData((prev) => {
      const logos = [...prev.featuredIn.logos];
      logos[index] = url;
      return { ...prev, featuredIn: { ...prev.featuredIn, logos } };
    });
  };

  const setGalleryImage = (index: number, url: string) => {
    setData((prev) => {
      const images = [...prev.gallery.images];
      images[index] = url;
      return { ...prev, gallery: { ...prev.gallery, images } };
    });
  };

  return (
    <>
      <PageMeta title="About Page Content | StudyCafe Admin" description="Update About page for studycafe.in" />
      <PageBreadcrumb pageTitle="About Page Content" />
      <div className="space-y-6">
        <Section title="Page & hero">
          <div>
            <Label>Browser / SEO title</Label>
            <Input
              value={data.pageTitle}
              onChange={(e) => setData((p) => ({ ...p, pageTitle: e.target.value }))}
              placeholder="About Us"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Hero title</Label>
              <Input
                value={data.hero.title}
                onChange={(e) => setData((p) => ({ ...p, hero: { ...p.hero, title: e.target.value } }))}
              />
            </div>
            <div>
              <Label>Hero subtitle</Label>
              <Input
                value={data.hero.subtitle}
                onChange={(e) => setData((p) => ({ ...p, hero: { ...p.hero, subtitle: e.target.value } }))}
              />
            </div>
          </div>
          <div>
            <Label>Hero background image</Label>
            <ImageUpload
              value={data.hero.backgroundImage}
              onChange={(url) => setData((p) => ({ ...p, hero: { ...p.hero, backgroundImage: url } }))}
            />
          </div>
        </Section>

        <Section title="Intro (StudyCafe block)">
          <div>
            <Label>Heading</Label>
            <Input
              value={data.description.heading}
              onChange={(e) =>
                setData((p) => ({ ...p, description: { ...p.description, heading: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label>Body (HTML)</Label>
            <RichTextEditor
              value={data.description.bodyHtml}
              onChange={(value) =>
                setData((p) => ({ ...p, description: { ...p.description, bodyHtml: value } }))
              }
              minHeight="220px"
            />
          </div>
          <div>
            <Label>Side image</Label>
            <ImageUpload
              value={data.description.imageUrl}
              onChange={(url) =>
                setData((p) => ({ ...p, description: { ...p.description, imageUrl: url } }))
              }
            />
          </div>
        </Section>

        <Section title="Stats row (4 tiles)">
          {data.stats.map((stat, i) => (
            <div key={i} className="grid gap-4 border-b border-gray-100 pb-4 dark:border-gray-800 sm:grid-cols-3">
              <div>
                <Label>Label {i + 1}</Label>
                <Input value={stat.title} onChange={(e) => setStat(i, { title: e.target.value })} />
              </div>
              <div>
                <Label>Value {i + 1}</Label>
                <Input value={stat.value} onChange={(e) => setStat(i, { value: e.target.value })} />
              </div>
              <div>
                <Label>Icon {i + 1}</Label>
                <ImageUpload value={stat.icon} onChange={(url) => setStat(i, { icon: url })} />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Mission">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.mission.sectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, mission: { ...p.mission, sectionTitle: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label>Mission body (HTML)</Label>
            <RichTextEditor
              value={data.mission.body}
              onChange={(value) => setData((p) => ({ ...p, mission: { ...p.mission, body: value } }))}
              minHeight="200px"
            />
          </div>
          {[0, 1].map((idx) => (
            <div key={idx} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Card {idx + 1}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={data.mission.cards[idx as 0 | 1].title}
                    onChange={(e) => setMissionCard(idx as 0 | 1, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <ImageUpload
                    value={data.mission.cards[idx as 0 | 1].icon}
                    onChange={(url) => setMissionCard(idx as 0 | 1, { icon: url })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <TextArea
                    rows={3}
                    value={data.mission.cards[idx as 0 | 1].description}
                    onChange={(value) => setMissionCard(idx as 0 | 1, { description: value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Our Journey (7 milestones — layout fixed on site)">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.journey.sectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, journey: { ...p.journey, sectionTitle: e.target.value } }))
              }
            />
          </div>
          {data.journey.milestones.slice(0, 7).map((m, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-3">
              <div>
                <Label>Year {i + 1}</Label>
                <Input value={m.year} onChange={(e) => setMilestone(i, { year: e.target.value })} />
              </div>
              <div>
                <Label>Title {i + 1}</Label>
                <Input value={m.title} onChange={(e) => setMilestone(i, { title: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <Label>Description {i + 1}</Label>
                <TextArea rows={2} value={m.description} onChange={(value) => setMilestone(i, { description: value })} />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Leadership">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Block title</Label>
              <Input
                value={data.leadership.title}
                onChange={(e) =>
                  setData((p) => ({ ...p, leadership: { ...p.leadership, title: e.target.value } }))
                }
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={data.leadership.subtitle}
                onChange={(e) =>
                  setData((p) => ({ ...p, leadership: { ...p.leadership, subtitle: e.target.value } }))
                }
              />
            </div>
          </div>
          {data.leadership.leaders.map((leader, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-2">
              <div>
                <Label>Name {i + 1}</Label>
                <Input value={leader.name} onChange={(e) => setLeader(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>Role {i + 1}</Label>
                <Input value={leader.role} onChange={(e) => setLeader(i, { role: e.target.value })} />
              </div>
              <div>
                <Label>Photo {i + 1}</Label>
                <ImageUpload value={leader.image} onChange={(url) => setLeader(i, { image: url })} />
              </div>
              <div>
                <Label>LinkedIn URL (optional)</Label>
                <Input
                  value={leader.linkedin ?? ""}
                  onChange={(e) => setLeader(i, { linkedin: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Managers">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.managers.sectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, managers: { ...p.managers, sectionTitle: e.target.value } }))
              }
            />
          </div>
          {data.managers.members.map((member, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
              <p className="mb-2 text-sm font-medium">Person {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={member.name} onChange={(e) => setManager(i, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={member.role} onChange={(e) => setManager(i, { role: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Photo</Label>
                  <ImageUpload value={member.image} onChange={(url) => setManager(i, { image: url })} />
                </div>
                <div>
                  <Label>Instagram URL</Label>
                  <Input
                    value={member.social?.instagram ?? ""}
                    onChange={(e) =>
                      setManager(i, {
                        social: { ...member.social, instagram: e.target.value || undefined },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Twitter / X URL</Label>
                  <Input
                    value={member.social?.twitter ?? ""}
                    onChange={(e) =>
                      setManager(i, {
                        social: { ...member.social, twitter: e.target.value || undefined },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={member.social?.linkedin ?? ""}
                    onChange={(e) =>
                      setManager(i, {
                        social: { ...member.social, linkedin: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Team members">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.team.sectionTitle}
              onChange={(e) => setData((p) => ({ ...p, team: { ...p.team, sectionTitle: e.target.value } }))}
            />
          </div>
          {data.team.members.map((member, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
              <p className="mb-2 text-sm font-medium">Member {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={member.name} onChange={(e) => setTeamMember(i, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={member.role} onChange={(e) => setTeamMember(i, { role: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Photo</Label>
                  <ImageUpload value={member.image} onChange={(url) => setTeamMember(i, { image: url })} />
                </div>
                <div>
                  <Label>Instagram URL</Label>
                  <Input
                    value={member.social?.instagram ?? ""}
                    onChange={(e) =>
                      setTeamMember(i, {
                        social: { ...member.social, instagram: e.target.value || undefined },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Twitter / X URL</Label>
                  <Input
                    value={member.social?.twitter ?? ""}
                    onChange={(e) =>
                      setTeamMember(i, {
                        social: { ...member.social, twitter: e.target.value || undefined },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={member.social?.linkedin ?? ""}
                    onChange={(e) =>
                      setTeamMember(i, {
                        social: { ...member.social, linkedin: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Awards & recognition">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.awards.sectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, awards: { ...p.awards, sectionTitle: e.target.value } }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Certificate / award image 1</Label>
              <ImageUpload value={data.awards.images[0] ?? ""} onChange={(url) => setAwardImage(0, url)} />
            </div>
            <div>
              <Label>Certificate / award image 2</Label>
              <ImageUpload value={data.awards.images[1] ?? ""} onChange={(url) => setAwardImage(1, url)} />
            </div>
          </div>
        </Section>

        <Section title="Featured in (logos)">
          <div>
            <Label>Section title</Label>
            <Input
              value={data.featuredIn.sectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, featuredIn: { ...p.featuredIn, sectionTitle: e.target.value } }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.featuredIn.logos.map((logo, i) => (
              <div key={i}>
                <Label>Logo {i + 1}</Label>
                <ImageUpload value={logo} onChange={(url) => setFeaturedLogo(i, url)} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Gallery (marquee)">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.gallery.images.map((src, i) => (
              <div key={i}>
                <Label>Image {i + 1}</Label>
                <ImageUpload value={src} onChange={(url) => setGalleryImage(i, url)} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Footer message / contact card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Get in touch title</Label>
              <Input
                value={data.message.getInTouchTitle}
                onChange={(e) =>
                  setData((p) => ({ ...p, message: { ...p.message, getInTouchTitle: e.target.value } }))
                }
              />
            </div>
            <div>
              <Label>Company name</Label>
              <Input
                value={data.message.companyName}
                onChange={(e) =>
                  setData((p) => ({ ...p, message: { ...p.message, companyName: e.target.value } }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Address (use line breaks)</Label>
            <TextArea
              rows={3}
              value={data.message.address}
              onChange={(value) =>
                setData((p) => ({ ...p, message: { ...p.message, address: value } }))
              }
            />
          </div>
          <div>
            <Label>Founder section title</Label>
            <Input
              value={data.message.founderSectionTitle}
              onChange={(e) =>
                setData((p) => ({ ...p, message: { ...p.message, founderSectionTitle: e.target.value } }))
              }
            />
          </div>
          <div>
            <Label>Founder message (plain text or HTML)</Label>
            <RichTextEditor
              value={data.message.founderMessage}
              onChange={(value) =>
                setData((p) => ({ ...p, message: { ...p.message, founderMessage: value } }))
              }
              minHeight="160px"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Founder name</Label>
              <Input
                value={data.message.founderName}
                onChange={(e) =>
                  setData((p) => ({ ...p, message: { ...p.message, founderName: e.target.value } }))
                }
              />
            </div>
            <div>
              <Label>Founder role</Label>
              <Input
                value={data.message.founderRole}
                onChange={(e) =>
                  setData((p) => ({ ...p, message: { ...p.message, founderRole: e.target.value } }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Founder photo</Label>
            <ImageUpload
              value={data.message.founderImage}
              onChange={(url) =>
                setData((p) => ({ ...p, message: { ...p.message, founderImage: url } }))
              }
            />
          </div>
          <div>
            <Label>Founder card background</Label>
            <ImageUpload
              value={data.message.cardBackgroundImage}
              onChange={(url) =>
                setData((p) => ({ ...p, message: { ...p.message, cardBackgroundImage: url } }))
              }
            />
          </div>
        </Section>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="sm" disabled={loading || saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
