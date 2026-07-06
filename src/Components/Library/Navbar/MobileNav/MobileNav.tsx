import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import { MobileBottomNavBar, MobileBottomNavInner, MobileBottomNavItem, MobileBottomNavLabel, MobileBottomCenterWrap, MobileBottomActionBackdrop, MobileBottomActionMenu, MobileBottomActionItem, MobileBottomCenterButton, MobileSidebar, MobileSidebarBrand, MobileSidebarLogo, MobileSidebarVersion } from "./MobileNav.styles"
import { AccountSnapshot } from "Components/AccountSnapshot"
import { useNavigate } from "react-router-dom"
import titleName from '../../../../Assets/TitleName.png';
import { COLORS } from '../../../../constants/colors';
import { CURRENT_APP_VERSION } from '../../../../config/appVersion';


interface MobileNavProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    quickCreateRef?: React.RefObject<HTMLDivElement>;
    isQuickCreateOpen: boolean;
    setIsQuickCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeRoute: string;
    isUserTenant: boolean;
    isHomeowner: boolean;
    isTeamMemberAccount: boolean;
    isPropertyContext: boolean;
    pathname: string;
    canAccessTeam: boolean;
    canAccessProperties: boolean;
    canViewPages: boolean;
    favorites: { id: string; title: string; slug: string }[];
}


export const MobileHamburgerNav: React.FC<MobileNavProps> = ({ isSidebarOpen, setIsSidebarOpen, isUserTenant, isHomeowner, isTeamMemberAccount, canAccessTeam, canAccessProperties, canViewPages, favorites, activeRoute }: MobileNavProps) => {
    const navigate = useNavigate();
    const navigationItems = [
        {
            label: 'Support Center',
            path: 'support',
            visible: true,
        },
        {
            label: 'Team',
            path: 'team',
            visible: !isUserTenant && canAccessTeam,
        },
        {
            label: 'Reports',
            path: 'report',
            visible: !isUserTenant && (canAccessProperties || canViewPages),
        },
    ];

    return (
        <div>
            <MobileSidebar $isOpen={isSidebarOpen}>
                <MobileSidebarBrand>
                    <MobileSidebarLogo src={titleName} alt='Maintley' />
                </MobileSidebarBrand>
                {/* Navigation Menu */}
                <div style={{ padding: '20px', paddingTop: '0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <h3
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: COLORS.textMuted,
                            textTransform: 'uppercase',
                        }}>
                        Navigation
                    </h3>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {navigationItems
                            .filter((item) => item.visible)
                            .map((item) => (
                                <li
                                    key={item.label}
                                    style={{
                                        padding: '10px 0',
                                        fontSize: '14px',
                                        color: COLORS.textSecondary,
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease',
                                        borderBottom: `1px solid ${COLORS.borderLight}`,
                                        textDecoration: activeRoute === `/${item.path}` ? 'underline' : 'none',
                                        textUnderlineOffset: '4px',
                                        textDecorationThickness: '2px',
                                        textDecorationColor: activeRoute === `/${item.path}` ? COLORS.primary : 'transparent',
                                    }}
                                    onClick={() => {
                                        navigate(`/${item.path}`);
                                        setIsSidebarOpen(false);
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.color = COLORS.primary)
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.color = COLORS.textSecondary)
                                    }>
                                    {item.label}
                                </li>
                            ))}
                    </ul>
                </div>

                {!isUserTenant && !isHomeowner && (
                    <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}` }}>
                        <h3
                            style={{
                                margin: '0 0 12px 0',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: COLORS.textMuted,
                                textTransform: 'uppercase',
                            }}>
                            Favorites
                        </h3>
                        {favorites.length > 0 ? (
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {favorites.slice(0, 10).map((property) => (
                                    <li
                                        key={property.id}
                                        style={{
                                            padding: '8px 0',
                                            fontSize: '13px',
                                            color: COLORS.textSecondary,
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            borderBottom: `1px solid ${COLORS.borderLight}`,
                                            textDecoration: activeRoute === `/property/${property.slug}` ? 'underline' : 'none',
                                            textUnderlineOffset: '4px',
                                            textDecorationThickness: '2px',
                                            textDecorationColor: activeRoute === `/property/${property.slug}` ? COLORS.primary : 'transparent',
                                        }}
                                        onClick={() => {
                                            navigate(`/property/${property.slug}`);
                                            setIsSidebarOpen(false);
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.color = COLORS.primary)
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.color = COLORS.textSecondary)
                                        }>
                                        {'★ ' + property.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                                No favorite properties
                            </div>
                        )}

                    </div>

                )}
                <div style={{ width: '100%', borderTop: `1px solid ${COLORS.border}` }}>
                    {!isUserTenant && !isTeamMemberAccount && (
                        <AccountSnapshot isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                    )}
                </div>
                <MobileSidebarVersion>Maintley v{CURRENT_APP_VERSION}</MobileSidebarVersion>
            </MobileSidebar>
        </div>
    )
}


export const MobileBottomNav: React.FC<MobileNavProps> = ({ isPropertyContext, pathname, setIsQuickCreateOpen, isQuickCreateOpen, quickCreateRef, activeRoute }: MobileNavProps) => {
    const navigate = useNavigate();
    const isApplianceContext = /^\/property\/[^/]+\/device\/[^/]+\/?$/i.test(pathname);
    const propertyPathMatch = pathname.match(/^\/property\/([^/]+)/i);
    const propertyBasePath = propertyPathMatch
        ? `/property/${propertyPathMatch[1]}`
        : pathname;
    const quickCreateActions = isApplianceContext
        ? [
            { key: 'add_part', label: 'Part', x: -100, y: 0 },
            { key: 'add_task', label: 'Task', x: -55, y: -55 },
            { key: 'upload_document', label: 'Document', x: 55, y: -55 },
            { key: 'add_log', label: 'Log', x: 100, y: 0 },
        ]
        : isPropertyContext
            ? [
                { key: 'add_task', label: 'Task', x: -100, y: 0 },
            { key: 'add_system', label: 'Equipment', x: -55, y: -55 },
                { key: 'upload_document', label: 'Document', x: 55, y: -55 },
                { key: 'add_contractor', label: 'Contractor', x: 100, y: 0 },
            ]
            : [
                { key: 'add_task', label: 'Task', x: -100, y: -10 },
                { key: 'add_system', label: 'Equipment', x: 0, y: -60 },
                { key: 'add_property', label: 'Home', x: 100, y: -10 },
            ];

    const handleQuickCreateAction = (action: string) => {
        const navigateToPropertyAction = (tab: string, propertyAction: string) => {
            const params = new URLSearchParams({
                tab,
                action: propertyAction,
            });
            navigate({
                pathname: propertyBasePath,
                search: `?${params.toString()}`,
            });
        };

        const navigateToApplianceAction = (applianceAction: string) => {
            const params = new URLSearchParams({
                action: applianceAction,
            });
            navigate({
                pathname,
                search: `?${params.toString()}`,
            }, { replace: true });
        };

        switch (action) {
            case 'add_part':
                navigateToApplianceAction('add_part');
                break;
            case 'add_task':
                if (isApplianceContext) {
                    navigateToApplianceAction('add-task');
                } else if (isPropertyContext) {
                    navigateToPropertyAction('tasks', 'create-task');
                } else {
                    navigate('/tasks?action=create');
                }
                break;
            case 'add_system':
                if (isPropertyContext) {
                    navigateToPropertyAction('devices', 'create-system');
                } else {
                    navigate('/devices?action=create');
                }
                break;
            case 'add_property':
                navigate('/properties?action=create');
                break;
            case 'upload_document':
                if (isApplianceContext) {
                    navigateToApplianceAction('upload-document');
                } else if (isPropertyContext) {
                    navigateToPropertyAction('documents', 'upload-document');
                } else {
                    navigate('/report?action=upload');
                }
                break;
            case 'add_log':
                navigateToApplianceAction('add-log');
                break;
            case 'add_contractor':
                if (isPropertyContext) {
                    navigateToPropertyAction('contractors', 'add-contractor');
                } else {
                    navigate('/team?action=add-contractor');
                }
                break;
            default:
                break;
        }

        setIsQuickCreateOpen(false);
    };
    return (
        <MobileBottomNavBar aria-label='Main navigation'>
            <MobileBottomNavInner>
                <MobileBottomNavItem
                    type='button'
                    $active={activeRoute === '/dashboard'}
                    onClick={() => navigate('/dashboard')}
                    aria-current={activeRoute === '/dashboard' ? 'page' : undefined}>
                    <MobileBottomNavLabel>Today</MobileBottomNavLabel>
                </MobileBottomNavItem>

                <MobileBottomNavItem
                    type='button'
                    $active={activeRoute === '/tasks'}
                    onClick={() => navigate('/tasks')}
                    aria-current={activeRoute === '/tasks' ? 'page' : undefined}>
                    <MobileBottomNavLabel>Tasks</MobileBottomNavLabel>
                </MobileBottomNavItem>

                <MobileBottomCenterWrap ref={quickCreateRef}>
                    <MobileBottomActionBackdrop $open={isQuickCreateOpen} />
                    <MobileBottomActionMenu $open={isQuickCreateOpen}>
                        {quickCreateActions.map((action) => (
                            <MobileBottomActionItem
                                key={action.key}
                                type='button'
                                $x={action.x}
                                $y={action.y}
                                onClick={() => handleQuickCreateAction(action.key)}>
                                {action.label}
                            </MobileBottomActionItem>
                        ))}
                    </MobileBottomActionMenu>

                    <MobileBottomCenterButton
                        type='button'
                        $open={isQuickCreateOpen}
                        onClick={() => setIsQuickCreateOpen((prev) => !prev)}
                        aria-label='Open quick create menu'
                        aria-expanded={isQuickCreateOpen}>
                        <FontAwesomeIcon icon={faPlus} />
                    </MobileBottomCenterButton>
                </MobileBottomCenterWrap>

                <MobileBottomNavItem
                    type='button'
                    $active={activeRoute === '/devices'}
                    onClick={() => navigate('/devices')}
                    aria-current={activeRoute === '/devices' ? 'page' : undefined}>
                    <MobileBottomNavLabel>Equipment</MobileBottomNavLabel>
                </MobileBottomNavItem>

                <MobileBottomNavItem
                    type='button'
                    $active={activeRoute === '/properties'}
                    onClick={() => navigate('/properties')}
                    aria-current={activeRoute === '/properties' ? 'page' : undefined}>
                    <MobileBottomNavLabel>Home</MobileBottomNavLabel>
                </MobileBottomNavItem>
            </MobileBottomNavInner>
        </MobileBottomNavBar>
    )
}
