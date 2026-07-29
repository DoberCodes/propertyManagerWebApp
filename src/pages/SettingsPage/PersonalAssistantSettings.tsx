import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { callFirebaseFunction } from 'config/firebaseFunctions';
import { FormGroup, FormInput, FormLabel, SectionTitle } from 'Components/Library';
import { AccountButton, ErrorMessage, Section } from './SettingPage.styles';

const SCOPES = [
	['properties:read', 'Property details'],
	['equipment:read', 'Equipment records'],
	['tasks:read', 'Tasks and upcoming work'],
	['maintenance:read', 'Maintenance history'],
	['intelligence:read', 'Property Intelligence'],
	['documents:metadata:read', 'Document names and metadata'],
] as const;

type Credential = {
	credentialId: string;
	name: string;
	tokenPrefix: string;
	propertyIds: string[];
	scopes: string[];
	status: 'active' | 'revoked';
	expiresAt?: number | null;
};

type ManageResponse = { credentials?: Credential[]; credential?: Credential; token?: string; success?: boolean };

export const PersonalAssistantSettings: React.FC = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const groups = useSelector((state: RootState) => state.propertyData.groups);
	const properties = useMemo(
		() => groups.flatMap((group) => group.properties || []).filter((property, index, all) => all.findIndex((item) => item.id === property.id) === index),
		[groups],
	);
	const [credentials, setCredentials] = useState<Credential[]>([]);
	const [name, setName] = useState('Personal assistant');
	const [propertyIds, setPropertyIds] = useState<string[]>([]);
	const [scopes, setScopes] = useState<string[]>(SCOPES.map(([scope]) => scope));
	const [expiresIn, setExpiresIn] = useState('90');
	const [issuedToken, setIssuedToken] = useState('');
	const [busy, setBusy] = useState('');
	const [error, setError] = useState('');

	const invoke = useCallback(async (data: Record<string, unknown>) => {
		const result = await callFirebaseFunction<Record<string, unknown>, ManageResponse>('managePersonalAssistantCredentials', data);
		return result.data;
	}, []);

	const load = useCallback(async () => {
		setError('');
		try {
			const response = await invoke({ action: 'list' });
			setCredentials(response.credentials || []);
		} catch (caught) {
			console.error('Unable to load personal assistant credentials', caught);
			setError('Maintley could not load personal assistant access. Try again.');
		}
	}, [invoke]);

	useEffect(() => { void load(); }, [load]);

	const toggle = (value: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
		setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
	};

	const create = async () => {
		if (!currentUser || !propertyIds.length || !scopes.length) {
			setError('Choose at least one property and one type of information.');
			return;
		}
		setBusy('create');
		setError('');
		try {
			const days = Number(expiresIn);
			const response = await invoke({
				action: 'create', name, accountId: currentUser.accountId || currentUser.id,
				propertyIds, scopes,
				expiresAtMs: days > 0 ? Date.now() + days * 86_400_000 : 0,
			});
			setIssuedToken(response.token || '');
			await load();
		} catch (caught) {
			console.error('Unable to create personal assistant credential', caught);
			setError('Maintley could not create this access token. Check the selections and try again.');
		} finally { setBusy(''); }
	};

	const updateCredential = async (action: 'revoke' | 'rotate', credentialId: string) => {
		setBusy(`${action}:${credentialId}`);
		setError('');
		try {
			const response = await invoke({ action, credentialId });
			if (action === 'rotate') setIssuedToken(response.token || '');
			await load();
		} catch (caught) {
			console.error(`Unable to ${action} personal assistant credential`, caught);
			setError(`Maintley could not ${action} this access token. Try again.`);
		} finally { setBusy(''); }
	};

	return (
		<>
			<Section>
				<SectionTitle>Personal Assistant Access</SectionTitle>
				<p style={{ color: '#6b7280', lineHeight: 1.55 }}>Create read-only access for a trusted server-side personal assistant. It can only see the properties and information you choose.</p>
				{error && <ErrorMessage>{error}</ErrorMessage>}
				{issuedToken && (
					<div style={{ padding: 16, marginBottom: 18, border: '1px solid #f59e0b', borderRadius: 8, background: '#fffbeb' }}>
						<strong>Copy this token now. It will not be shown again.</strong>
						<code style={{ display: 'block', margin: '10px 0', padding: 12, background: '#fff', borderRadius: 6, overflowWrap: 'anywhere' }}>{issuedToken}</code>
						<AccountButton type='button' onClick={() => void navigator.clipboard.writeText(issuedToken)}>Copy token</AccountButton>
					</div>
				)}
				<FormGroup><FormLabel>Connection name</FormLabel><FormInput value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></FormGroup>
				<FormGroup><FormLabel>Expires after</FormLabel><FormInput as='select' value={expiresIn} onChange={(event) => setExpiresIn(event.target.value)}><option value='30'>30 days</option><option value='90'>90 days</option><option value='365'>1 year</option><option value='0'>No expiration</option></FormInput></FormGroup>
				<fieldset style={{ border: 0, padding: 0, margin: '0 0 18px' }}><legend style={{ fontWeight: 600, marginBottom: 8 }}>Properties</legend>
					{properties.length ? properties.map((property) => <label key={property.id} style={{ display: 'block', marginBottom: 8 }}><input type='checkbox' checked={propertyIds.includes(property.id)} onChange={() => toggle(property.id, propertyIds, setPropertyIds)} /> <span>{property.title}</span></label>) : <p style={{ color: '#6b7280' }}>No properties are available in this account.</p>}
				</fieldset>
				<fieldset style={{ border: 0, padding: 0, margin: '0 0 18px' }}><legend style={{ fontWeight: 600, marginBottom: 8 }}>Information it can read</legend>
					{SCOPES.map(([scope, label]) => <label key={scope} style={{ display: 'block', marginBottom: 8 }}><input type='checkbox' checked={scopes.includes(scope)} onChange={() => toggle(scope, scopes, setScopes)} /> <span>{label}</span></label>)}
				</fieldset>
				<AccountButton type='button' disabled={busy === 'create' || !properties.length} onClick={create}>{busy === 'create' ? 'Creating...' : 'Create access token'}</AccountButton>
			</Section>
			<Section>
				<SectionTitle>Existing Connections</SectionTitle>
				{credentials.length === 0 ? <p style={{ color: '#6b7280' }}>No personal assistant connections have been created.</p> : credentials.map((credential) => (
					<div key={credential.credentialId} style={{ padding: 14, marginBottom: 10, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff' }}>
						<strong>{credential.name}</strong><div style={{ color: '#6b7280', margin: '5px 0 10px', overflowWrap: 'anywhere' }}>{credential.status === 'active' ? 'Active' : 'Revoked'} · {credential.tokenPrefix}… · {credential.propertyIds.length} {credential.propertyIds.length === 1 ? 'property' : 'properties'}</div>
						{credential.status === 'active' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AccountButton type='button' disabled={!!busy} onClick={() => void updateCredential('rotate', credential.credentialId)}>Rotate</AccountButton><AccountButton type='button' disabled={!!busy} onClick={() => void updateCredential('revoke', credential.credentialId)}>Revoke</AccountButton></div>}
					</div>
				))}
			</Section>
		</>
	);
};
