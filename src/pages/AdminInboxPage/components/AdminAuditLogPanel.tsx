import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    ButtonRow,
    ErrorText,
    Input,
    Label,
    SubTitle,
    UserDetailsPanel,
    UserPanelToolbar,
    UserPanelWrap,
    UserTable,
    UserTableWrap,
} from '../AdminInboxPage.styles';
import {
    selectFilteredAuditLogs,
    selectAuditLogsLoading,
    selectAuditLogsError,
    selectAuditLogsLastLoaded,
    selectAuditLogsFilters,
} from '../../../Redux/selectors/adminPortalSelectors';
import { setAuditLogsFilters } from '../../../Redux/Slices/adminPortalSlice';
import { fetchAuditLogs } from '../../../Redux/thunks/adminPortalThunks';
import type { AppDispatch } from '../../../Redux/store/store';

interface AdminAuditLogPanelProps {
    sessionToken: string;
}

const formatDate = (value?: string | null): string => {
    if (!value) return 'n/a';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'n/a' : parsed.toLocaleString();
};

const formatLabel = (value?: string | null): string =>
    String(value || 'n/a')
        .replace(/[\s_-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'n/a';

const toSummary = (record?: Record<string, unknown> | null): string => {
    if (!record || typeof record !== 'object') return 'n/a';
    const keys = Object.keys(record);
    if (keys.length === 0) return 'n/a';

    const previewPairs = keys.slice(0, 3).map((key) => `${key}: ${String(record[key])}`);
    const suffix = keys.length > 3 ? ` (+${keys.length - 3} more)` : '';
    return `${previewPairs.join(' | ')}${suffix}`;
};

export const AdminAuditLogPanel: React.FC<AdminAuditLogPanelProps> = ({ sessionToken }) => {
    const dispatch = useDispatch<AppDispatch>();
    const filteredLogs = useSelector(selectFilteredAuditLogs);
    const loading = useSelector(selectAuditLogsLoading);
    const error = useSelector(selectAuditLogsError);
    const lastLoadedAt = useSelector(selectAuditLogsLastLoaded);
    const filters = useSelector(selectAuditLogsFilters);

    const actionOptions = useMemo(() => {
        const uniqueActions = new Set<string>();
        for (const log of filteredLogs) {
            const actionValue = String(log.action || '').trim();
            if (actionValue) uniqueActions.add(actionValue);
        }
        return Array.from(uniqueActions).sort((left, right) => left.localeCompare(right));
    }, [filteredLogs]);

    const handleLoadLogs = async () => {
        await dispatch(
            fetchAuditLogs({
                sessionToken,
                query: filters.query,
                action: filters.action,
                targetId: filters.targetId,
                limit: 200,
            }),
        );
    };

    const handleFilterChange = (filterUpdates: Partial<typeof filters>) => {
        dispatch(setAuditLogsFilters(filterUpdates));
    };

    return (
        <UserPanelWrap>
            <SubTitle>
                Review admin actions for billing, user support, and ticket workflows. This page is restricted
                to top-level Maintley roles.
            </SubTitle>

            {error ? <ErrorText>{error}</ErrorText> : null}

            <UserDetailsPanel>
                <UserPanelToolbar>
                    <div>
                        <Label htmlFor='audit-query'>Search</Label>
                        <Input
                            id='audit-query'
                            type='text'
                            value={filters.query}
                            onChange={(event) => handleFilterChange({ query: event.target.value })}
                            placeholder='Action, category, target, or admin name'
                        />
                    </div>
                    <div>
                        <Label htmlFor='audit-action'>Action</Label>
                        <Input
                            id='audit-action'
                            type='text'
                            list='admin-audit-actions'
                            value={filters.action}
                            onChange={(event) => handleFilterChange({ action: event.target.value })}
                            placeholder='Optional action filter'
                        />
                        <datalist id='admin-audit-actions'>
                            {actionOptions.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <Label htmlFor='audit-target'>Target ID</Label>
                        <Input
                            id='audit-target'
                            type='text'
                            value={filters.targetId}
                            onChange={(event) => handleFilterChange({ targetId: event.target.value })}
                            placeholder='Optional user/ticket/target id'
                        />
                    </div>
                </UserPanelToolbar>
                <ButtonRow>
                    <Label>
                        {filteredLogs.length} log {filteredLogs.length === 1 ? 'entry' : 'entries'}
                        {lastLoadedAt ? ` loaded at ${lastLoadedAt}` : ''}
                    </Label>
                    <Button type='button' onClick={() => void handleLoadLogs()} disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                </ButtonRow>
            </UserDetailsPanel>

            <UserTableWrap>
                <UserTable>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Admin</th>
                            <th>Before</th>
                            <th>After</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    {loading ? 'Loading audit logs...' : 'No audit logs found yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => {
                                const adminDisplay =
                                    String(log.performedBy?.displayName || '').trim() ||
                                    String(log.performedBy?.email || '').trim() ||
                                    'n/a';

                                return (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.createdAt)}</td>
                                        <td>
                                            {formatLabel(log.action)}
                                            <div style={{ fontSize: 11 }}>{formatLabel(log.category)}</div>
                                        </td>
                                        <td>
                                            {formatLabel(log.targetType)}
                                            <div style={{ fontSize: 11 }}>{String(log.targetId || 'n/a')}</div>
                                        </td>
                                        <td>{adminDisplay}</td>
                                        <td>{toSummary(log.before)}</td>
                                        <td>{toSummary(log.after)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </UserTable>
            </UserTableWrap>
        </UserPanelWrap>
    );
};
