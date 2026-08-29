interface ManualStepProps {
  number: number;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

function ManualStep({
  number,
  title,
  description,
  image,
  imageAlt,
}: ManualStepProps) {
  return (
    <article className="border-surface-700 bg-surface-900 rounded-xl border p-4 sm:p-6">
      <div className="flex gap-4">
        <span className="bg-accent-500/10 text-accent-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>

      {image && (
        <div className="border-surface-700 bg-surface-950 mt-5 overflow-hidden rounded-lg border">
          <img
            src={image}
            alt={imageAlt}
            className="h-auto w-full object-contain"
            loading="lazy"
          />
        </div>
      )}
    </article>
  );
}

export function ManualPage() {
  return (
    <main className="bg-surface-950 min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-accent-400 text-xs font-semibold tracking-widest uppercase">
            Manual
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">
            Prepare diagnostic data
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Export the signal from iba Analyzer, then upload the video and iba
            export file on the Overview page for synchronized analysis.
          </p>
        </div>

        <aside className="border-accent-500/30 bg-accent-500/10 mb-8 rounded-xl border p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Synchronize device clocks before recording
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Synchronization accuracy depends heavily on the time alignment
            between the phone recording the video and the iba server. Even a
            small clock difference can offset the video from the signal data.
            For the best results, synchronize both devices with the same NTP
            server before collecting diagnostic data.
          </p>
        </aside>

        <div className="space-y-5">
          <ManualStep
            number={1}
            title="Select a signal in iba Analyzer"
            description="Open iba Analyzer, select the signal you want to analyze, and drag it into the display area."
          />
          <ManualStep
            number={2}
            title="Open File / Export"
            description="From the menu bar, open File and select Export to display the data export window."
            image="/file-export.png"
            imageAlt="Location of the File and Export menu in iba Analyzer"
          />
          <ManualStep
            number={3}
            title="Configure the export options"
            description="Select the export options shown inside the red boxes, then export the file."
            image="/Export_Setting.png"
            imageAlt="Required export options in iba Analyzer"
          />
          <ManualStep
            number={4}
            title="Upload the data"
            description="Return to the Overview page and upload the video and the iba export file to their corresponding fields."
          />
        </div>
      </div>
    </main>
  );
}
