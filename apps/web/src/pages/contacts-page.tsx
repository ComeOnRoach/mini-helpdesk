import { useEffect, useRef, useState } from 'react';
import { ErrorState, LoadingState } from '../components/state-views';
import { findNearestOffice, type NearestOffice } from './contacts/geo';
import { OFFICES } from './contacts/offices';

type ErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; result: NearestOffice }
  | { kind: 'error'; error: ErrorKind };

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  denied: 'Location access was denied. Allow it in your browser settings and try again.',
  unavailable: 'Your location is unavailable. Check your device settings and try again.',
  timeout: 'Locating took too long. Please try again.',
  unsupported: 'Geolocation is not supported by this browser.',
};

function errorKindFromCode(code: number): ErrorKind {
  if (code === 1) return 'denied';
  if (code === 3) return 'timeout';
  return 'unavailable';
}

export function ContactsPage() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function locate() {
    if (!('geolocation' in navigator)) {
      setStatus({ kind: 'error', error: 'unsupported' });
      return;
    }
    setStatus({ kind: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const result = findNearestOffice(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          OFFICES,
        );
        setStatus({ kind: 'success', result });
      },
      (err) => {
        if (!mounted.current) return;
        setStatus({ kind: 'error', error: errorKindFromCode(err.code) });
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: false },
    );
  }

  const nearestId = status.kind === 'success' ? status.result.office.id : null;

  return (
    <section>
      <h1 data-testid="contacts-title">Contacts</h1>
      <p>Our offices. Use your location to find the one closest to you.</p>
      <p>
        <button
          type="button"
          onClick={locate}
          disabled={status.kind === 'loading'}
          data-testid="contacts-locate"
        >
          Nearest office
        </button>
      </p>
      {status.kind === 'loading' && <LoadingState prefix="contacts" />}
      {status.kind === 'error' && (
        <div data-error-kind={status.error}>
          <ErrorState
            prefix="contacts"
            message={ERROR_MESSAGES[status.error]}
            onRetry={status.error === 'unsupported' ? undefined : locate}
          />
        </div>
      )}
      {status.kind === 'success' && (
        <p className="state" role="status" data-testid="contacts-result">
          Nearest office:{' '}
          <strong data-testid="contacts-result-office">{status.result.office.name}</strong>,{' '}
          <span data-testid="contacts-result-distance">{status.result.distanceKm.toFixed(1)}</span>{' '}
          km
        </p>
      )}
      <ul className="office-list">
        {OFFICES.map((office) => (
          <li
            key={office.id}
            className="office"
            data-testid="contacts-office"
            data-office-id={office.id}
            data-nearest={office.id === nearestId ? 'true' : 'false'}
          >
            <h2>{office.name}</h2>
            <p>{office.address}</p>
            <p className="office-coords">
              {office.lat.toFixed(4)}, {office.lng.toFixed(4)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
