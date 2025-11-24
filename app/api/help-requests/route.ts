import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveHelpRequests, createHelpRequest } from '@/app/lib/db';
import { HelpRequestInput } from '@/app/types';

export async function GET() {
  try {
    const requests = await getAllActiveHelpRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch help requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.phone || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const data: HelpRequestInput = {
      place_name: body.place_name,
      phone: body.phone,
      backup_phone: body.backup_phone,
      num_people: String(body.num_people || ''),
      has_elderly: Boolean(body.has_elderly),
      has_children: Boolean(body.has_children),
      has_sick: Boolean(body.has_sick),
      has_pets: Boolean(body.has_pets),
      additional_message: body.additional_message,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
    };

    const id = await createHelpRequest(data);
    
    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating help request:', error);
    return NextResponse.json(
      { error: 'Failed to create help request' },
      { status: 500 }
    );
  }
}

