import { NextRequest, NextResponse } from 'next/server';
import { deleteHelpRequest, updateHelpRequestStatus, getHelpRequestById } from '@/app/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const success = await deleteHelpRequest(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting help request:', error);
    return NextResponse.json(
      { error: 'Failed to delete help request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (body.status !== 'resolved') {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const success = await updateHelpRequestStatus(id, 'resolved');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating help request:', error);
    return NextResponse.json(
      { error: 'Failed to update help request' },
      { status: 500 }
    );
  }
}

