import { useState } from 'react';

const FAQ_URL = '/widgets/faq.html';

// Level 1 of the nested-frame scenario: the FAQ widget (level 2) is a static same-origin page that
// embeds the feedback form (level 3). The frames are independent of React.
export function HelpPage() {
  const [frameLoaded, setFrameLoaded] = useState(false);

  return (
    <section>
      <h1 data-testid="help-title">Help</h1>
      <p>
        Browse the frequently asked questions below, or{' '}
        <a href={FAQ_URL} target="_blank" rel="noopener" data-testid="help-faq-open">
          open the FAQ in a new tab
        </a>
        .
      </p>
      {!frameLoaded && (
        <p className="state" data-testid="help-faq-loading">
          Loading FAQ...
        </p>
      )}
      <iframe
        id="faq-frame"
        title="FAQ"
        src={FAQ_URL}
        className="faq-frame"
        onLoad={() => setFrameLoaded(true)}
        data-testid="help-faq-frame"
      />
    </section>
  );
}
