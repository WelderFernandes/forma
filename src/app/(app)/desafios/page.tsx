import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth-helpers";
import {
  ChallengesView,
  type AchievementDTO,
  type ChallengeDTO,
  type UserAchievementDTO,
  type UserChallengeDTO,
} from "@/components/desafios/challenges-view";

export const metadata: Metadata = {
  title: "Desafios",
};

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [challenges, userChallenges, achievements, unlocked] = await Promise.all([
    prisma.challenge.findMany({ orderBy: { days: "asc" } }),
    prisma.userChallenge.findMany({
      where: { userId: user.id },
      include: { challenge: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.achievement.findMany({ orderBy: { xp: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
  ]);

  const challengeList: ChallengeDTO[] = challenges.map((challenge) => ({
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    days: challenge.days,
    xp: challenge.xp,
    icon: challenge.icon,
    color: challenge.color,
  }));

  const myChallenges: UserChallengeDTO[] = userChallenges.map((item) => ({
    id: item.id,
    challengeId: item.challengeId,
    currentDay: item.currentDay,
    streak: item.streak,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    challenge: {
      id: item.challenge.id,
      slug: item.challenge.slug,
      title: item.challenge.title,
      description: item.challenge.description,
      category: item.challenge.category,
      days: item.challenge.days,
      xp: item.challenge.xp,
      icon: item.challenge.icon,
      color: item.challenge.color,
    },
  }));

  const achievementList: AchievementDTO[] = achievements.map((achievement) => ({
    id: achievement.id,
    slug: achievement.slug,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    xp: achievement.xp,
    category: achievement.category,
  }));

  const unlockedList: UserAchievementDTO[] = unlocked.map((item) => ({
    id: item.id,
    achievementId: item.achievementId,
    unlockedAt: item.unlockedAt.toISOString(),
  }));

  return (
    <ChallengesView
      challenges={challengeList}
      userChallenges={myChallenges}
      achievements={achievementList}
      unlocked={unlockedList}
    />
  );
}
