import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

afterEach(cleanup);

describe('Header Component', () => {
  it('renders title and last updated timestamp', () => {
    render(
      <Header
        onAnalyze={vi.fn()}
        isAnalyzing={false}
        lastUpdated="10:30:00 AM"
      />
    );

    expect(screen.getByText(/Bia Energy/i)).toBeInTheDocument();
    expect(screen.getByText(/10:30:00 AM/i)).toBeInTheDocument();
  });

  it('triggers onAnalyze callback when button is clicked', async () => {
    const handleAnalyze = vi.fn();
    render(
      <Header
        onAnalyze={handleAnalyze}
        isAnalyzing={false}
        lastUpdated="10:30:00 AM"
      />
    );

    const button = screen.getByRole('button', { name: /Ejecutar Análisis IA/i });
    await userEvent.click(button);

    expect(handleAnalyze).toHaveBeenCalledTimes(1);
  });

  it('disables button when analyzing', () => {
    render(
      <Header
        onAnalyze={vi.fn()}
        isAnalyzing={true}
        lastUpdated="10:30:00 AM"
      />
    );

    const button = screen.getByRole('button', { name: /Analizando/i });
    expect(button).toBeDisabled();
  });
});