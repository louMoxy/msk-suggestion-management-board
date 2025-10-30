import React from 'react';
import { EmployeesTable } from './EmployeesTable';
import { SuggestionsTable } from './SuggestionsTable';
import { AppView } from '../Types/appView';

function getViewFromUrl(): AppView {
  if (typeof window === 'undefined') return AppView.Suggestions;
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  return view === AppView.Employees || view === AppView.Suggestions ? (view as AppView) : AppView.Suggestions;
}

function setViewInUrl(view: AppView) {
  const params = new URLSearchParams(window.location.search);
  if (view !== AppView.Suggestions) {
    params.set('view', view);
  } else {
    params.delete('view');
  }
  const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState({}, '', newUrl);
}

export default function AppViewRouter(): React.JSX.Element {
  const [view, setView] = React.useState<AppView>(getViewFromUrl());

  React.useEffect(() => {
    // sync URL when view changes
    setViewInUrl(view);
  }, [view]);

  const handleChange = (_e: React.SyntheticEvent, newView: AppView | null) => {
    if (newView) setView(newView);
  };

  return view === AppView.Employees ? (
    <EmployeesTable appView={view} onChangeAppView={handleChange} />
  ) : (
    <SuggestionsTable appView={view} onChangeAppView={handleChange} />
  );
}


