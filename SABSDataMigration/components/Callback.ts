

export type NoteCreationCallback = () => void;

export type AppointmentCreationCallback = () => void;

export type ParticipantCreationCallback = () => void;

export type setParticipants = (participants:any) => void;

export type onSearchParticipantsCallback = (filter: string, noteFilter: string, reports?: boolean) => void;

export type onChangedCallback = (value: any, name: string) => void;

export type setStateCallback = (value: any, field?: string, key?: string) => void;

export type onSelectDateCallback = (date: any, name:string) => void;

export type createNewNoteCallback = () => void;

export type createNewAppointmentCallback = () => void;

export type onClose = () => void;

export type loadDocumentsCallback = () => void;

export type onClickCallback = () => void;




