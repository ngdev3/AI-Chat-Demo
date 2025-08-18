import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { prisma } from "./db";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return false;
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });

    if (!user) {
        return false;
    }

    if (!user.stripeSubscriptionId || !user.stripeCurrentPeriodEnd) {
        return false;
    }

    // Check if the subscription is active and not expired
    // We add a 1-day grace period
    const isActive = user.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

    return isActive;
}
