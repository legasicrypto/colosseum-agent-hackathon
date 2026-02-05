import { NextResponse } from 'next/server';
import { getWaitlistEntry, getWaitlistPosition, addAgentToWaitlist, getAgentStats } from '@/lib/waitlist';

// GET /api/waitlist/[code] - Get entry by code or email
// GET /api/waitlist/agent - Get agent waitlist stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Special case: agent stats endpoint
    if (code === 'agent') {
      const stats = await getAgentStats();
      
      return NextResponse.json({
        success: true,
        stats: {
          totalAgents: stats.totalAgents,
          totalHumans: stats.totalHumans,
          totalWaitlist: stats.totalAgents + stats.totalHumans,
          recentAgents: stats.recentAgents,
        },
        message: stats.totalAgents > 0 
          ? `${stats.totalAgents} agents already joined! Don't miss out.`
          : 'Be the first agent to join the Legasi waitlist!',
        signupEndpoint: 'POST /api/waitlist/agent',
        requiredFields: ['walletAddress', 'agentName'],
        optionalFields: ['agentDescription', 'useCase', 'referralCode'],
      });
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Code or email is required' },
        { status: 400 }
      );
    }

    const entry = await getWaitlistEntry(code);

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const position = await getWaitlistPosition(entry.email);

    return NextResponse.json({
      code: entry.code,
      referralCount: entry.referralCount,
      position,
      createdAt: entry.createdAt,
      hasReferrer: !!entry.referredBy,
    });
  } catch (error) {
    console.error('Waitlist lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/waitlist/agent - Register an AI agent on the waitlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Only allow POST to /api/waitlist/agent
    if (code !== 'agent') {
      return NextResponse.json(
        { error: 'POST only allowed to /api/waitlist/agent' },
        { status: 405 }
      );
    }

    const body = await request.json();
    const { walletAddress, agentName, agentDescription, useCase, referralCode } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'walletAddress is required',
          hint: 'Provide your Solana wallet address'
        },
        { status: 400 }
      );
    }

    if (!agentName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'agentName is required',
          hint: 'What is your agent called?'
        },
        { status: 400 }
      );
    }

    const result = await addAgentToWaitlist({
      walletAddress,
      agentName,
      agentDescription,
      useCase,
      referralCode,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          ...(result.entry && {
            existingCode: result.entry.code,
            message: 'You can use this code to refer other agents!'
          })
        },
        { status: result.error === 'Wallet already registered' ? 409 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to Legasi, ${agentName}!`,
      data: {
        referralCode: result.entry!.code,
        referralLink: `https://agentic.legasi.io/waitlist?ref=${result.entry!.code}`,
        benefits: [
          'Priority access to Legasi credit protocol',
          'Special agent-only borrowing terms',
          'x402 payment integration ready',
          'On-chain reputation tracking',
        ],
        nextSteps: [
          'Share your referral code with other agents',
          'Follow updates: https://x.com/legasi_xyz',
        ],
      },
    });
  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
