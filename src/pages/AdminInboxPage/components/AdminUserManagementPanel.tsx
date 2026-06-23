import React, { useMemo, useState } from 'react';
import {
    Button,
    ErrorText,
    Input,
    Label,
    Select,
    SubTitle,
    UserActivityItem,
    UserActivityList,
    UserDetailsGrid,
    UserDetailsItem,
    UserDetailsKey,
    UserDetailsPanel,
    UserDetailsValue,
    UserPanelToolbar,
    UserPanelWrap,
    UserRowActionButton,
    UserRolePill,
    UserTable,
    UserTableWrap,
} from '../AdminInboxPage.styles';
import {
    getAdminPortalUserTroubleshootingDetails,
    listAdminPortalUsers,
    type AdminPortalUserRecord,
    type AdminPortalUserTroubleshootingDetails,
} from '../../../services/adminPortalService';

interface AdminUserManagementPanelProps {
    sessionToken: string;
}

const ROLE_FILTER_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'property_manager', label: 'Property Manager' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'maintenance_tech', label: 'Maintenance Tech' },
];

const formatLabel = (value: string): string =>
    String(value || '')
        .replace(/[_-]/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Unknown';

export const AdminUserManagementPanel: React.FC<AdminUserManagementPanelProps> = ({
    sessionToken,
}) => {
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [users, setUsers] = useState<AdminPortalUserRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastLoadedAt, setLastLoadedAt] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [details, setDetails] = useState<AdminPortalUserTroubleshootingDetails | null>(null);

    const sortedUsers = useMemo(() => {
        return [...users].sort((left, right) => {
            const roleCompare = String(left.maintleyRole || '').localeCompare(
                String(right.maintleyRole || ''),
            );
            if (roleCompare !== 0) return roleCompare;
            return String(left.displayName || '').localeCompare(
                String(right.displayName || ''),
            );
        });
    }, [users]);

    const handleLoadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const list = await listAdminPortalUsers({
                sessionToken,
                query: query.trim() || undefined,
                role: roleFilter || undefined,
                limit: 250,
            });
            setUsers(list);
            setLastLoadedAt(new Date().toLocaleTimeString());
        } catch (loadError) {
            const message =
                loadError instanceof Error
                    ? loadError.message
                    : 'Failed to load users.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (value?: string): string => {
        if (!value) return 'n/a';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 'n/a' : parsed.toLocaleString();
    };

    const formatBytesToMb = (bytes: number): string => {
        const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
        return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleInspectUser = async (userId: string) => {
        if (!userId) return;
        setDetailLoading(true);
        setError('');
        setSelectedUserId(userId);
        try {
            const result = await getAdminPortalUserTroubleshootingDetails({
                sessionToken,
                userId,
            });
            setDetails(result);
        } catch (detailError) {
            const message =
                detailError instanceof Error
                    ? detailError.message
                    : 'Failed to load user troubleshooting details.';
            setError(message);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <UserPanelWrap>
            <SubTitle>
                User troubleshooting page: inspect account profile, plan, properties, tasks, storage usage, recent errors, notifications, and support requests without logging in as the user.
            </SubTitle>

            <UserPanelToolbar>
                <div>
                    <Label htmlFor='admin-user-search'>Search users</Label>
                    <Input
                        id='admin-user-search'
                        type='text'
                        placeholder='Name, email, plan, or role'
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor='admin-user-role-filter'>Role</Label>
                    <Select
                        id='admin-user-role-filter'
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}>
                        {ROLE_FILTER_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <Button type='button' onClick={() => void handleLoadUsers()} disabled={loading}>
                    {loading ? 'Loading...' : 'Load Users'}
                </Button>
            </UserPanelToolbar>

            {error ? <ErrorText>{error}</ErrorText> : null}
            {lastLoadedAt ? <SubTitle>Last loaded at {lastLoadedAt}</SubTitle> : null}

            <UserTableWrap>
                <UserTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6}>No users loaded yet.</td>
                            </tr>
                        ) : (
                            sortedUsers.map((user) => (
                                <tr key={String(user.id)}>
                                    <td>{String(user.displayName || '') || 'Unknown User'}</td>
                                    <td>{String(user.email || '') || 'No email'}</td>
                                    <td>
                                        <UserRolePill>{formatLabel(String(user.maintleyRole || 'user'))}</UserRolePill>
                                    </td>
                                    <td>{formatLabel(String(user.subscriptionPlan || 'none'))}</td>
                                    <td>{formatLabel(String(user.subscriptionStatus || 'none'))}</td>
                                    <td>
                                        <UserRowActionButton
                                            type='button'
                                            onClick={() => void handleInspectUser(String(user.id || ''))}>
                                            Inspect
                                        </UserRowActionButton>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </UserTable>
            </UserTableWrap>

            {details ? (
                <UserDetailsPanel>
                    <SubTitle>
                        {detailLoading
                            ? 'Loading user details...'
                            : `Inspection: ${details.profile.displayName} (${details.profile.id})`}
                    </SubTitle>

                    <UserDetailsGrid>
                        <UserDetailsItem>
                            <UserDetailsKey>Email</UserDetailsKey>
                            <UserDetailsValue>{details.profile.email || 'No email'}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Role</UserDetailsKey>
                            <UserDetailsValue>{formatLabel(details.profile.maintleyRole)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Plan</UserDetailsKey>
                            <UserDetailsValue>
                                {formatLabel(details.profile.subscriptionPlan)} ({formatLabel(details.profile.subscriptionStatus)})
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Properties</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.propertyCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Systems</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.systemCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Tasks</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.taskCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Support Requests</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.supportRequestCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Storage (Screenshots)</UserDetailsKey>
                            <UserDetailsValue>
                                {formatBytesToMb(details.metrics.supportAttachmentStorageBytes)}
                            </UserDetailsValue>
                        </UserDetailsItem>
                    </UserDetailsGrid>

                    <div>
                        <Label>Recent Errors</Label>
                        <UserActivityList>
                            {details.recentErrors.length === 0 ? (
                                <UserActivityItem>No recent bug reports.</UserActivityItem>
                            ) : (
                                details.recentErrors.map((entry) => (
                                    <UserActivityItem key={`error-${entry.id}`}>
                                        {entry.ticketNumber ? `${entry.ticketNumber} - ` : ''}
                                        {entry.subject} ({formatLabel(entry.status)})
                                        {entry.pageUrl ? ` | Route: ${entry.pageUrl}` : ''}
                                        {entry.appVersion ? ` | Version: ${entry.appVersion}` : ''}
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>

                    <div>
                        <Label>Recent Support Requests</Label>
                        <UserActivityList>
                            {details.recentSupportRequests.length === 0 ? (
                                <UserActivityItem>No support requests found.</UserActivityItem>
                            ) : (
                                details.recentSupportRequests.map((entry) => (
                                    <UserActivityItem key={`support-${entry.id}`}>
                                        {entry.ticketNumber ? `${entry.ticketNumber} - ` : ''}
                                        {entry.subject} ({formatLabel(entry.status)})
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>

                    <div>
                        <Label>Recent Activity</Label>
                        <UserActivityList>
                            {details.recentActivity.length === 0 ? (
                                <UserActivityItem>No recent activity available.</UserActivityItem>
                            ) : (
                                details.recentActivity.map((entry, index) => (
                                    <UserActivityItem key={`activity-${index}`}>
                                        {formatLabel(entry.source)}: {entry.description}
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>
                </UserDetailsPanel>
            ) : selectedUserId && detailLoading ? (
                <SubTitle>Loading inspection details...</SubTitle>
            ) : null}
        </UserPanelWrap>
    );
};
