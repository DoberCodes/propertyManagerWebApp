import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import { MobileBottomNavBar, MobileBottomNavInner, MobileBottomNavItem, MobileBottomNavLabel, MobileBottomCenterWrap, MobileBottomActionBackdrop, MobileBottomActionMenu, MobileBottomActionItem, MobileBottomCenterButton, MobileSidebar } from "./MobileNav.styles"
import { AccountSnapshot } from "Components/AccountSnapshot"
import { useNavigate } from "react-router-dom"


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
            label: 'Team',
            path: 'team',
            visible: !isUserTenant && canAccessTeam,
        },
        {
            label: 'Report',
            path: 'report',
            visible: !isUserTenant && (canAccessProperties || canViewPages),
        },
    ];

    console.info(activeRoute, 'activeRoute in mobile nav');


    return (
        <div>
            <MobileSidebar $isOpen={isSidebarOpen}>
                {/* Navigation Menu */}
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#999999',
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
                                        color: '#666666',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease',
                                        borderBottom: '1px solid #f0f0f0',
                                        textDecoration: activeRoute === `/${item.path}` ? 'underline' : 'none',
                                        textUnderlineOffset: '4px',
                                        textDecorationThickness: '2px',
                                        textDecorationColor: activeRoute === `/${item.path}` ? '#22c55e' : 'transparent',
                                    }}
                                    onClick={() => {
                                        navigate(`/${item.path}`);
                                        setIsSidebarOpen(false);
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.color = '#22c55e')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.color = '#666666')
                                    }>
                                    {item.label}
                                </li>
                            ))}
                    </ul>
                </div>

                {!isUserTenant && !isHomeowner && (
                    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                        <h3
                            style={{
                                margin: '0 0 12px 0',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#999999',
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
                                            color: '#666666',
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            borderBottom: '1px solid #f0f0f0',
                                            textDecoration: activeRoute === `/property/${property.slug}` ? 'underline' : 'none',
                                            textUnderlineOffset: '4px',
                                            textDecorationThickness: '2px',
                                            textDecorationColor: activeRoute === `/property/${property.slug}` ? '#22c55e' : 'transparent',
                                        }}
                                        onClick={() => {
                                            navigate(`/property/${property.slug}`);
                                            setIsSidebarOpen(false);
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.color = '#22c55e')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.color = '#666666')
                                        }>
                                        {'★ ' + property.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: '12px', color: '#999999' }}>
                                No favorite properties
                            </div>
                        )}

                    </div>

                )}
                <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }}>
                    {!isUserTenant && !isTeamMemberAccount && (
                        <AccountSnapshot isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                    )}
                </div>
            </MobileSidebar>
        </div>
    )
}


export const MobileBottomNav: React.FC<MobileNavProps> = ({ isPropertyContext, pathname, setIsQuickCreateOpen, isQuickCreateOpen, quickCreateRef, activeRoute }: MobileNavProps) => {
    const navigate = useNavigate();
    const quickCreateActions = isPropertyContext
        ? [
            { key: 'add_task', label: 'Add Task', x: -100, y: 0 },
            { key: 'add_system', label: 'Add System', x: -55, y: -55 },
            { key: 'upload_document', label: 'Upload', x: 55, y: -55 },
            { key: 'add_contractor', label: 'Contractor', x: 100, y: 0 },
        ]
        : [
            { key: 'add_task', label: 'Add Task', x: -100, y: -10 },
            { key: 'add_system', label: 'Add System', x: 0, y: -60 },
            { key: 'add_property', label: 'Property', x: 100, y: -10 },
        ];

    const handleQuickCreateAction = (action: string) => {
        switch (action) {
            case 'add_task':
                navigate(isPropertyContext ? `${pathname}?action=create-task` : '/tasks?action=create');
                break;
            case 'add_system':
                navigate(isPropertyContext ? `${pathname}?action=create-system` : '/devices?action=create');
                break;
            case 'add_property':
                navigate('/properties?action=create');
                break;
            case 'upload_document':
                navigate(isPropertyContext ? `${pathname}?action=upload-document` : '/report?action=upload');
                break;
            case 'add_contractor':
                navigate('/team?action=add-contractor');
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
                    <MobileBottomNavLabel>Dashboard</MobileBottomNavLabel>
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
                    <MobileBottomNavLabel>Systems</MobileBottomNavLabel>
                </MobileBottomNavItem>

                <MobileBottomNavItem
                    type='button'
                    $active={activeRoute === '/properties'}
                    onClick={() => navigate('/properties')}
                    aria-current={activeRoute === '/properties' ? 'page' : undefined}>
                    <MobileBottomNavLabel>Property</MobileBottomNavLabel>
                </MobileBottomNavItem>
            </MobileBottomNavInner>
        </MobileBottomNavBar>
    )
}