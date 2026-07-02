import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, Mock } from 'vitest';

const mockSupabase = vi.hoisted(() => {
  const chain: any = {
    data: [],
    select: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
  };
  return {
    from: vi.fn(() => chain),
  };
});

vi.mock('../lib/supabase', () => ({
  __esModule: true,
  supabase: mockSupabase,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('Chatbot', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as any;
    (window.HTMLElement.prototype as any).scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('uses Gemini response when API succeeds', async () => {
    const fetchMock = global.fetch as unknown as Mock;

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'LLM reply' }),
    } as Response);

    const user = userEvent.setup();

    const { Chatbot } = await import('./Chatbot');
    render(<Chatbot supabaseClient={mockSupabase as any} disableDataLoad />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Tell me something nice');
    const sendButton = screen.getByRole('button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('LLM reply')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/gemini',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('falls back to deterministic reply when Gemini fails', async () => {
    const fetchMock = global.fetch as unknown as Mock;
    fetchMock.mockRejectedValue(new Error('boom'));

    const user = userEvent.setup();

    const { Chatbot } = await import('./Chatbot');
    render(<Chatbot supabaseClient={mockSupabase as any} disableDataLoad />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Need help with food options');
    const sendButton = screen.getByRole('button');
    await user.click(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Submit feedback - Say/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
